// # Logic xử lý API
const Book = require('../models/book.model');

exports.getAllBooks = async (req, res) => {
  try {
    const books = await Book.getAll();
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching books', error: error.message });
  }
};

exports.createBook = async (req, res) => {
  try {
    const book = await Book.create(req.body);
    res.status(201).json(book);
  } catch (error) {
    res.status(400).json({ message: 'Error creating book', error: error.message });
  }
};
