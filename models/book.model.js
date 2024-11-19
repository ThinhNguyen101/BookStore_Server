//  # Định nghĩa tương tác cơ sở dữ liệu
const db = require('../config/db');

class Book {
  static async getAll() {
    const [rows] = await db.query('SELECT * FROM books');
    return rows;
  }

  static async create(data) {
    const { title, author, genre } = data;
    const [result] = await db.query(
      'INSERT INTO books (title, author, genre) VALUES (?, ?, ?)',
      [title, author, genre]
    );
    return { id: result.insertId, ...data };
  }
}

module.exports = Book;
