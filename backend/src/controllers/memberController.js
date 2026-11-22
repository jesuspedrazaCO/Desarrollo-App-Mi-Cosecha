const crypto = require('crypto');
const User = require('../models/User');
const Invitation = require('../models/Invitation');
const { sendEmail } = require('../utils/sendEmail');
const { signToken, buildPayload } = require('../utils/userPayload');

const INVITE_DAYS = 7;
const MAX_MEMBERS = 10; // miembros + invitaciones pendientes por finca

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// FRONTEND_URL puede traer varias direcciones separadas por coma: se usa la primera
const frontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/+$/, '');

// ── Administrador (rutas protegidas con protect + adminOnly) ─────────────────

// @route GET /api/members
exports.listMembers = async (req, res, next) => {
  try {
    const [members, invitations] = await Promise.all([
      User.find({ farmOwner: req.user._id }).select('name email active avatar role createdAt').sort({ createdAt: 1 }),
      Invitation.find({ owner: req.user._id }).select('name email role expiresAt createdAt').sort({ createdAt: -1 }),
    ]);
    res.json({ members, invitations, max: MAX_MEMBERS });
  } catch (error) { next(error); }
};

// @route POST /api/members/invite   (también sirve para reenviar una invitación)
exports.inviteMember = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const role = req.body.role === 'editor' ? 'editor' : 'viewer';
    const owner = req.user;

    if (email === owner.email) return res.status(400).json({ message: 'Ese es tu propio correo.' });
    if (await User.exists({ email })) {
      return res.status(400).json({ message: 'Ese correo ya tiene una cuenta en AgroFinanzas.' });
    }

    const existing = await Invitation.findOne({ owner: owner._id, email });
    if (!existing) {
      const [members, pending] = await Promise.all([
        User.countDocuments({ farmOwner: owner._id }),
        Invitation.countDocuments({ owner: owner._id }),
      ]);
      if (members + pending >= MAX_MEMBERS) {
        return res.status(400).json({ message: `Una finca puede tener hasta ${MAX_MEMBERS} miembros.` });
      }
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000);
    const invitation = await Invitation.findOneAndUpdate(
      { owner: owner._id, email },
      { name, role, tokenHash: hashToken(rawToken), expiresAt },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );

    const link = `${frontendUrl()}/invitacion/${rawToken}`;
    let emailSent = true;
    try {
      await sendEmail({
        to: email,
        subject: `${owner.name} te invitó a ${role === 'editor' ? 'colaborar en' : 'ver'} ${owner.farmName || 'su finca'} en AgroFinanzas`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #258a4e;">Te invitaron a AgroFinanzas</h2>
            <p>Hola ${escapeHtml(name)},</p>
            <p><strong>${escapeHtml(owner.name)}</strong> te invitó a ver los cultivos, gastos e ingresos de
            <strong>${escapeHtml(owner.farmName || 'su finca')}</strong>. ${role === 'editor'
              ? 'Podrás consultar todo, descargar los PDF y también registrar y editar datos (no podrás invitar ni quitar miembros).'
              : 'Podrás consultar todo y descargar los PDF (no podrás registrar ni cambiar datos).'}
            Este enlace es válido por ${INVITE_DAYS} días:</p>
            <p style="margin: 24px 0;">
              <a href="${link}" style="background: #258a4e; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold;">
                Aceptar invitación
              </a>
            </p>
            <p style="color: #888; font-size: 13px;">Si no esperabas este correo, puedes ignorarlo.</p>
          </div>
        `,
      });
    } catch (emailError) {
      // El correo falló (p. ej. Resend en modo de prueba): la invitación se conserva y el administrador
      // puede compartir el enlace él mismo. Solo el administrador recibe este enlace.
      emailSent = false;
      console.error('Error enviando invitación:', emailError?.message || emailError);
    }

    res.status(201).json({
      message: emailSent ? 'Invitación enviada.' : 'No se pudo enviar el correo, comparte el enlace.',
      emailSent,
      link,
      invitation: { _id: invitation._id, name, email, role, expiresAt },
    });
  } catch (error) { next(error); }
};

// @route DELETE /api/members/invitations/:id
exports.revokeInvitation = async (req, res, next) => {
  try {
    const result = await Invitation.deleteOne({ _id: req.params.id, owner: req.user._id });
    if (!result.deletedCount) return res.status(404).json({ message: 'Invitación no encontrada.' });
    res.json({ message: 'Invitación cancelada.' });
  } catch (error) { next(error); }
};

// @route PATCH /api/members/:id   { active?: boolean, role?: 'viewer' | 'editor' }
exports.updateMember = async (req, res, next) => {
  try {
    const set = {};
    if (req.body.active !== undefined) set.active = !!req.body.active;
    if (req.body.role !== undefined) set.role = req.body.role === 'editor' ? 'editor' : 'viewer';
    if (!Object.keys(set).length) return res.status(400).json({ message: 'No hay nada que actualizar.' });
    const member = await User.findOneAndUpdate(
      { _id: req.params.id, farmOwner: req.user._id },
      { $set: set },
      { new: true }
    ).select('name email active role createdAt');
    if (!member) return res.status(404).json({ message: 'Miembro no encontrado.' });
    res.json(member);
  } catch (error) { next(error); }
};

// @route DELETE /api/members/:id
exports.removeMember = async (req, res, next) => {
  try {
    const member = await User.findOneAndDelete({ _id: req.params.id, farmOwner: req.user._id });
    if (!member) return res.status(404).json({ message: 'Miembro no encontrado.' });
    res.json({ message: 'Miembro eliminado.' });
  } catch (error) { next(error); }
};

// ── Invitado (rutas públicas, el token del correo es la credencial) ──────────

// @route GET /api/auth/invitation/:token
exports.getInvitation = async (req, res, next) => {
  try {
    const invitation = await Invitation.findOne({ tokenHash: hashToken(req.params.token), expiresAt: { $gt: new Date() } })
      .populate('owner', 'name farmName');
    if (!invitation || !invitation.owner) {
      return res.status(404).json({ message: 'La invitación es inválida o ya expiró. Pídele al administrador que te envíe una nueva.' });
    }
    res.json({
      name: invitation.name,
      email: invitation.email,
      farmName: invitation.owner.farmName,
      inviterName: invitation.owner.name,
      role: invitation.role,
    });
  } catch (error) { next(error); }
};

// @route POST /api/auth/accept-invitation/:token   { password }
exports.acceptInvitation = async (req, res, next) => {
  try {
    // Se reclama la invitación de forma atómica: un mismo enlace no puede usarse dos veces
    const invitation = await Invitation.findOneAndDelete({ tokenHash: hashToken(req.params.token), expiresAt: { $gt: new Date() } });
    if (!invitation) {
      return res.status(400).json({ message: 'La invitación es inválida o ya expiró. Pídele al administrador que te envíe una nueva.' });
    }

    const owner = await User.findById(invitation.owner);
    if (!owner || !owner.active) {
      return res.status(400).json({ message: 'La finca ya no está disponible.' });
    }
    if (await User.exists({ email: invitation.email })) {
      return res.status(400).json({ message: 'Ese correo ya tiene una cuenta. Inicia sesión.' });
    }

    const user = await User.create({
      name: invitation.name,
      email: invitation.email,
      password: req.body.password,
      role: invitation.role === 'editor' ? 'editor' : 'viewer',
      farmOwner: owner._id,
    });

    res.status(201).json({ token: signToken(user._id), user: await buildPayload(user) });
  } catch (error) { next(error); }
};