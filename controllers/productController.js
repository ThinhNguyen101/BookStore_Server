const Product = require('../models/product');
const fs = require('fs');
const xlsx = require('xlsx');
// const path = require('path');


const getAllProducts = async (req, res) => {
  try {
    const result = await Product.getAll();  // Kết quả trả về từ Product.getAll()
    res.status(200).json(result);  // Trả về kết quả trực tiếp
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error });
  }
};
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.getById(id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSortedProducts = async (req, res) => {
  try {
    const { sortBy = 'ten_vat_pham', order = 'ASC' } = req.query;
    const products = await Product.getSortedProducts(sortBy, order);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSearchedProducts = async (req, res) => {
  try {
    const { keyword } = req.query;
    const products = await Product.searchProducts(keyword);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getFilteredByCategory = async (req, res) => {
  try {
    const { category } = req.query;
    const products = await Product.filterByCategory(category);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addProduct = async (req, res) => {
  const productDetails = req.body;
  const category = req.body.category;

  try {
    const result = await Product.addProduct(category, productDetails);
    res.json({
      success: true,
      message: 'Sản phẩm đã được thêm thành công.',
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thêm sản phẩm: ' + error.message,
    });
  }
};

const updateProducts = async (req, res) => {
  const productDetails = req.body;

  try {
    // Gọi hàm updateProduct từ model
    const result = await Product.updateProduct(productDetails);

    // Kiểm tra xem có sản phẩm nào bị ảnh hưởng không
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm để cập nhật.',
      });
    }

    // Trả về thông báo thành công
    res.json({
      success: true,
      message: 'Sản phẩm đã được cập nhật thành công.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: `Lỗi khi cập nhật sản phẩm: ${error.message}`,
    });
  }
};

const deleteProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await Product.deleteById(id);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tồn tại.',
      });
    }

    res.json({
      success: true,
      message: 'Sản phẩm đã được xóa thành công.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: `Lỗi khi xóa sản phẩm: ${error.message}`,
    });
  }
};


// const bulkUpdate = async (req, res) => {
//   try {
//     const { excel } = req.files;

//     // Kiểm tra xem file có được tải lên hay không
//     if (!excel) {
//       return res.status(400).json({ success: false, message: 'Không có file nào được tải lên.' });
//     }

//     // Kiểm tra loại file
//     if (excel.mimetype !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
//       fs.unlinkSync(excel.tempFilePath); // Xóa file tạm nếu không đúng loại
//       return res.status(400).json({ success: false, message: 'File không hợp lệ. Vui lòng tải lên file Excel.' });
//     }

//     // Đọc file Excel
//     const workbook = xlsx.readFile(excel.tempFilePath);
//     const sheetName = workbook.SheetNames[0];
//     const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

//     // Xử lý dữ liệu từ file Excel
//     const products = data.map((row) => ({
//       ten_vat_pham: row['Tên vật phẩm'],
//       gia_niem_yet: row['Giá niêm yết'],
//       so_luong_kha_dung: row['Số lượng khả dụng'],
//       category: row['Danh mục'],
//     }));

//     // Thêm sản phẩm hàng loạt vào cơ sở dữ liệu
//     await Product.bulkAddProducts(products);

//     // Xóa file tạm sau khi xử lý xong
//     fs.unlinkSync(excel.tempFilePath);

//     res.status(201).json({
//       success: true,
//       message: 'Sản phẩm đã được thêm hàng loạt thành công.',
//     });
//   } catch (error) {
//     console.error(error);

//     // Nếu file vẫn tồn tại, xóa nó để tránh lưu lại file tạm không cần thiết
//     if (req.files?.excel?.tempFilePath) {
//       fs.unlinkSync(req.files.excel.tempFilePath);
//     }

//     res.status(500).json({
//       success: false,
//       message: 'Lỗi khi thêm sản phẩm hàng loạt: ' + error.message,
//     });
//   }
// };



module.exports = {
  getAllProducts,
  getProductById,
  getSortedProducts,
  getSearchedProducts,
  getFilteredByCategory,
  addProduct,
  // bulkUpdate,
  updateProducts,
  deleteProductById,
};


