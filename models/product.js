const { sql, connect } = require('../config/db');

const getAll = async () => {
  const query = `
        SELECT  
          i.id_item AS ma_san_pham,
          CASE 
              WHEN s.id_item IS NOT NULL THEN N'Văn phòng phẩm'
              WHEN b.id_item IS NOT NULL THEN N'Sách'
              WHEN n.id_item IS NOT NULL THEN N'Báo'
          END AS danh_muc,
          i.ten_vat_pham AS ten_san_pham,
          i.gia_niem_yet,
          i.so_luong_kha_dung,
          COALESCE(SUM(o.sl_nhap), 0) AS so_luong_ban
        FROM 
          item i
        LEFT JOIN stationery s ON i.id_item = s.id_item
        LEFT JOIN book b ON i.id_item = b.id_item
        LEFT JOIN newspaper n ON i.id_item = n.id_item
        LEFT JOIN import_product o ON i.id_item = o.id_item
        GROUP BY 
            i.id_item, i.ten_vat_pham, i.gia_niem_yet, i.so_luong_kha_dung,
            s.id_item, b.id_item, n.id_item;
      `;
  try {
    const pool = await connect();
    const result = await pool.request().query(query);

    return result.recordset || [];
  } catch (error) {
    console.error('Error in getAll query:', error.message);
    throw new Error('Error fetching products');
  }
};
const getById = async (id) => {
  const query = `
      SELECT 
        i.id_item AS ma_san_pham,
        i.ten_vat_pham AS ten_san_pham,
        i.gia_niem_yet,
        i.so_luong_kha_dung,
        CASE
            WHEN s.id_item IS NOT NULL THEN N'Văn phòng phẩm'
              WHEN b.id_item IS NOT NULL THEN N'Sách'
              WHEN n.id_item IS NOT NULL THEN N'Báo'
            ELSE NULL
        END AS danh_muc,
        b.ms_copy, b.tac_gia, b.tinh_trang, b.nsx AS book_nsx,
        n.tap_chi, n.so_bao, n.toa_soan,
        s.loai_hang, s.nsx AS stationery_nsx
      FROM item i
      LEFT JOIN book b ON i.id_item = b.id_item
      LEFT JOIN newspaper n ON i.id_item = n.id_item
      LEFT JOIN stationery s ON i.id_item = s.id_item
      WHERE i.id_item = @id;
    `;

  try {
    const pool = await connect();
    const result = await pool.request().input('id', sql.Int, id).query(query);

    if (result.recordset.length === 0) {
      console.error(`Product with id ${id} not found`);
      return null;
    }
    return result.recordset[0];
  } catch (error) {
    console.error('Error in getById query:', error.message);
    throw new Error(`Error fetching product with id ${id}`);
  }
};
const updateProduct = async (productDetails) => {
  const {
    id_item,
    ten_vat_pham,
    gia_niem_yet,
    so_luong_kha_dung,
    additionalDetails
  } = productDetails;

  try {
    const pool = await connect();

    const itemUpdateQuery = `
        UPDATE item
        SET 
          ten_vat_pham = @ten_vat_pham,
          gia_niem_yet = @gia_niem_yet,
          so_luong_kha_dung = @so_luong_kha_dung
        WHERE 
          id_item = @id_item
      `;
    const result = await pool.request()
      .input('id_item', sql.Int, id_item)
      .input('ten_vat_pham', sql.NVarChar, ten_vat_pham)
      .input('gia_niem_yet', sql.Money, gia_niem_yet)
      .input('so_luong_kha_dung', sql.Int, so_luong_kha_dung)
      .query(itemUpdateQuery);

    if (result.rowsAffected[0] === 0) {
      throw new Error('Không tìm thấy sản phẩm để cập nhật.');
    }

    if (additionalDetails) {
      let categoryQuery = '';
      const request = pool.request().input('id_item', sql.Int, id_item);

      if (additionalDetails.ms_copy) {
        categoryQuery = `
            UPDATE book
            SET 
              ms_copy = @ms_copy,
              tac_gia = @tac_gia,
              tinh_trang = @tinh_trang,
              nsx = @nsx
            WHERE id_item = @id_item
          `;
        request
          .input('ms_copy', sql.NVarChar, additionalDetails.ms_copy)
          .input('tac_gia', sql.NVarChar, additionalDetails.tac_gia)
          .input('tinh_trang', sql.NVarChar, additionalDetails.tinh_trang)
          .input('nsx', sql.VarChar, additionalDetails.nsx);
      } else if (additionalDetails.tap_chi) {
        categoryQuery = `
            UPDATE newspaper
            SET 
              tap_chi = @tap_chi,
              so_bao = @so_bao,
              toa_soan = @toa_soan
            WHERE id_item = @id_item
          `;
        request
          .input('tap_chi', sql.NVarChar, additionalDetails.tap_chi)
          .input('so_bao', sql.Int, additionalDetails.so_bao)
          .input('toa_soan', sql.NVarChar, additionalDetails.toa_soan);
      } else if (additionalDetails.loai_hang) {
        categoryQuery = `
            UPDATE stationery
            SET 
              loai_hang = @loai_hang,
              nsx = @nsx
            WHERE id_item = @id_item
          `;
        request
          .input('loai_hang', sql.NVarChar, additionalDetails.loai_hang)
          .input('nsx', sql.NVarChar, additionalDetails.nsx);
      }

      if (categoryQuery) {
        const categoryResult = await request.query(categoryQuery);

        if (categoryResult.rowsAffected[0] === 0) {
          throw new Error('Không tìm thấy danh mục sản phẩm để cập nhật.');
        }
      }
    }

    return { success: true, message: 'Sản phẩm đã được cập nhật thành công.' };
  } catch (error) {
    console.error('Error in updateProduct:', error.message);
    throw new Error('Lỗi khi cập nhật sản phẩm: ' + error.message);
  }
};
const deleteById = async (id) => {
  try {
    const pool = await connect(); // Kết nối cơ sở dữ liệu
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('DELETE FROM item WHERE id_item = @id');

    return result.rowsAffected[0] > 0; // Kiểm tra số hàng bị ảnh hưởng
  } catch (error) {
    console.error('Error deleting product by ID:', error.message);
    throw new Error('Error deleting product by ID');
  }
};
const addProduct = async (category, productDetails) => {
  const id_item = Math.floor(Math.random() * 101);
  const {
    ten_vat_pham,
    gia_niem_yet,
    so_luong_kha_dung,
    time_of_entry,
    employee_id,
    additionalDetails,
  } = productDetails;

  try {
    const pool = await connect();

    // Thêm vào bảng `item`
    const itemQuery = `
        INSERT INTO item (id_item, gia_niem_yet, ten_vat_pham, so_luong_kha_dung)
        VALUES (@id_item, @gia_niem_yet, @ten_vat_pham, @so_luong_kha_dung)
      `;
    await pool.request()
      .input('id_item', sql.Int, id_item)
      .input('gia_niem_yet', sql.Money, gia_niem_yet)
      .input('ten_vat_pham', sql.NVarChar, ten_vat_pham)
      .input('so_luong_kha_dung', sql.Int, so_luong_kha_dung)
      .query(itemQuery);

    // Thêm vào bảng danh mục tương ứng
    let categoryQuery = '';
    const request = pool.request().input('id_item', sql.Int, id_item);

    switch (category.toLowerCase()) {
      case 'book':
        categoryQuery = `
            INSERT INTO book (id_item, ms_copy, tac_gia, tinh_trang, nsx)
            VALUES (@id_item, @ms_copy, @tac_gia, @tinh_trang, @nsx)
          `;
        request
          .input('ms_copy', sql.NVarChar, additionalDetails.ms_copy)
          .input('tac_gia', sql.NVarChar, additionalDetails.tac_gia)
          .input('tinh_trang', sql.NVarChar, additionalDetails.tinh_trang)
          .input('nsx', sql.VarChar, additionalDetails.nsx);
        break;

      case 'newspaper':
        categoryQuery = `
            INSERT INTO newspaper (id_item, tap_chi, so_bao, toa_soan)
            VALUES (@id_item, @tap_chi, @so_bao, @toa_soan)
          `;
        request
          .input('tap_chi', sql.NVarChar, additionalDetails.tap_chi)
          .input('so_bao', sql.Int, additionalDetails.so_bao)
          .input('toa_soan', sql.NVarChar, additionalDetails.toa_soan);
        break;

      case 'stationery':
        categoryQuery = `
            INSERT INTO stationery (id_item, loai_hang, nsx)
            VALUES (@id_item, @loai_hang, @nsx)
          `;
        request
          .input('loai_hang', sql.NVarChar, additionalDetails.loai_hang)
          .input('nsx', sql.NVarChar, additionalDetails.nsx);
        break;

      default:
        throw new Error('Danh mục không hợp lệ');
    }

    await request.query(categoryQuery);

    // Log nhập sản phẩm vào bảng `import_product`
    const importQuery = `
        INSERT INTO import_product (id_item, id_employee, sl_nhap, ngay_cap_nhap)
        VALUES (@id_item, @employee_id, @so_luong_kha_dung, @time_of_entry)
      `;
    await pool.request()
      .input('id_item', sql.Int, id_item)
      .input('employee_id', sql.Int, employee_id)
      .input('so_luong_kha_dung', sql.Int, so_luong_kha_dung)
      .input('time_of_entry', sql.DateTime, time_of_entry)
      .query(importQuery);

    return { id_item };
  } catch (error) {
    console.error('Error in addProduct query:', error.message);
    throw new Error('Error adding product');
  }
};
const filterByCategory = async (category) => {
  let query;
  let params = [];

  switch (category.toLowerCase()) {
    case 'book' || 'sách':
      query = `
        SELECT 
          i.id_item AS ma_san_pham,
          i.ten_vat_pham,
          i.gia_niem_yet,
          i.so_luong_kha_dung,
          b.ms_copy,
          b.tac_gia,
          b.tinh_trang,
          b.nsx
        FROM item i
        INNER JOIN book b ON i.id_item = b.id_item;
      `;
      break;

    case 'newspaper' || 'báo':
      query = `
        SELECT 
          i.id_item AS ma_san_pham,
          i.ten_vat_pham,
          i.gia_niem_yet,
          i.so_luong_kha_dung,
          n.tap_chi,
          n.so_bao,
          n.toa_soan
        FROM item i
        INNER JOIN newspaper n ON i.id_item = n.id_item;
      `;
      break;

    case 'stationery' || 'văn phòng phẩm':
      query = `
        SELECT 
          i.id_item AS ma_san_pham,
          i.ten_vat_pham,
          i.gia_niem_yet,
          i.so_luong_kha_dung,
          s.loai_hang,
          s.nsx
        FROM item i
        INNER JOIN stationery s ON i.id_item = s.id_item;
      `;
      break;

    default:
      console.error(`Invalid category: ${category}`);
      throw new Error('Danh mục không hợp lệ.');
  }

  try {
    const pool = await connect();
    const result = await pool.request().query(query);
    return result.recordset;
  } catch (error) {
    console.error(`Error in filterByCategory query for category ${category}:`, error.message);
    throw new Error(`Lỗi khi lọc sản phẩm theo danh mục: ${category}`);
  }
};
module.exports = {
  getAll,
  getById,
  updateProduct,
  addProduct,
  deleteById,
  filterByCategory,
};