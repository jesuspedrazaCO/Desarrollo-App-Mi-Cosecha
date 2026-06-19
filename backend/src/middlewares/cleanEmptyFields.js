const cleanEmptyFields = (fields) => (req, res, next) => {
  fields.forEach((field) => {
    if (req.body[field] === '' || req.body[field] === 'undefined') {
      req.body[field] = null
    }
  })
  next()
}

const cleanEmptyDates = (fields) => (req, res, next) => {
  fields.forEach((field) => {
    if (req.body[field] === '' || req.body[field] === 'undefined') {
      delete req.body[field]
    }
  })
  next()
}

module.exports = { cleanEmptyFields, cleanEmptyDates }
