const CalendarEvent = require('../models/CalendarEvent');

const getEvents = async (req, res, next) => {
  try {
    const { startDate, endDate, type, crop } = req.query;
    const query = { owner: req.user._id };

    if (type) query.type = type;
    if (crop) query.crop = crop;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const events = await CalendarEvent.find(query)
      .populate('crop', 'name type')
      .sort({ date: 1 });

    res.json(events);
  } catch (error) {
    next(error);
  }
};

const getUpcomingEvents = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const future = new Date(today);
    future.setDate(future.getDate() + 30);

    const events = await CalendarEvent.find({
      owner: req.user._id,
      date: { $gte: today, $lte: future },
      completed: false,
    })
      .populate('crop', 'name type')
      .sort({ date: 1 })
      .limit(10);

    res.json(events);
  } catch (error) {
    next(error);
  }
};

const createEvent = async (req, res, next) => {
  try {
    const event = await CalendarEvent.create({ ...req.body, owner: req.user._id });
    await event.populate('crop', 'name type');
    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const event = await CalendarEvent.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('crop', 'name type');

    if (!event) return res.status(404).json({ message: 'Evento no encontrado.' });
    res.json(event);
  } catch (error) {
    next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const event = await CalendarEvent.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!event) return res.status(404).json({ message: 'Evento no encontrado.' });
    res.json({ message: 'Evento eliminado correctamente.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getEvents, getUpcomingEvents, createEvent, updateEvent, deleteEvent };