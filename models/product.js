const { sql, connect } = require('../config/db');

const Product = {
  getAll: async () => {
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
      const pool = await connect();  // Kết nối cơ sở dữ liệu
      const result = await pool.request().query(query);
  
      // Trả về kết quả đúng định dạng
      return result.recordset || [];  // Đảm bảo không trả về null hoặc undefined
    } catch (error) {
      console.error('Error in getAll query:', error.message);
      throw new Error('Error fetching products');
    }
  },

  getById: async (id) => {
    const query = `
      SELECT 
        i.id_item AS ma_san_pham,
        i.ten_vat_pham,
        i.gia_niem_yet,
        i.so_luong_kha_dung,
        CASE
            WHEN b.id_item IS NOT NULL THEN N'sách'
            WHEN n.id_item IS NOT NULL THEN 'newspaper'
            WHEN s.id_item IS NOT NULL THEN 'stationery'
            ELSE 'unknown'
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
      const pool = await connect(); // Kết nối đến cơ sở dữ liệu
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
  },

  getSortedProducts: async (sortBy, order) => {
    const allowedFields = ['ten_vat_pham', 'gia_niem_yet', 'so_luong_kha_dung'];
    const allowedOrders = ['ASC', 'DESC'];
    
    // Kiểm tra trường sắp xếp hợp lệ
    if (!allowedFields.includes(sortBy)) {
      console.error(`Invalid sort field: ${sortBy}`);
      throw new Error('Trường để sắp xếp không hợp lệ.');
    }

    // Kiểm tra thứ tự sắp xếp hợp lệ
    if (!allowedOrders.includes(order)) {
      console.error(`Invalid order: ${order}`);
      throw new Error('Thứ tự sắp xếp không hợp lệ.');
    }

    // Câu truy vấn SQL
    const query = `
      SELECT 
        i.id_item AS ma_san_pham,
        i.ten_vat_pham,
        i.gia_niem_yet,
        i.so_luong_kha_dung
      FROM item i
      ORDER BY ${sortBy} ${order}
    `;

    try {
      const pool = await connect();
      const result = await pool.request().query(query);
      return result.recordset; // Trả về kết quả truy vấn
    } catch (error) {
      console.error('Error in getSortedProducts query:', error.message);
      throw new Error('Lỗi khi lấy sản phẩm theo thứ tự sắp xếp.');
    }
  },

  searchProducts: async (keyword) => {
    const query = `
      SELECT 
        i.id_item AS ma_san_pham,
        i.ten_vat_pham,
        i.gia_niem_yet,
        i.so_luong_kha_dung
      FROM item i
      WHERE i.ten_vat_pham LIKE @keyword
    `;

    try {
      const pool = await connect();
      const result = await pool.request().input('keyword', sql.NVarChar, `%${keyword}%`).query(query);
      return result.recordset; // Trả về kết quả tìm kiếm
    } catch (error) {
      console.error('Error in searchProducts query:', error.message);
      throw new Error('Lỗi khi tìm kiếm sản phẩm.');
    }
  },

  filterByCategory: async (category) => {
    let query;
    let params = [];

    switch (category.toLowerCase()) {
      case 'book':
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

      case 'newspaper':
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

      case 'stationery':
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
      return result.recordset; // Trả về kết quả lọc theo danh mục
    } catch (error) {
      console.error(`Error in filterByCategory query for category ${category}:`, error.message);
      throw new Error(`Lỗi khi lọc sản phẩm theo danh mục: ${category}`);
    }
  },

  deleteById: async (id) => {
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
  },

  updateProduct:  async (productDetails) => {
    const {
      id_item,
      ten_vat_pham,
      gia_niem_yet,
      so_luong_kha_dung,
      additionalDetails
    } = productDetails;
  
    try {
      const pool = await connect();
  
      // Cập nhật bảng `item`
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
  
      // Cập nhật bảng danh mục dựa trên loại sản phẩm
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
  },

  addProduct: async (category, productDetails) => {
    const {
      id_item,
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
  },
  // bulkAddProducts: async (products) => {
  //   try {
  //     const pool = await connect();

  //     // Sử dụng transaction để đảm bảo toàn vẹn dữ liệu
  //     const transaction = pool.transaction();
  //     await transaction.begin();

  //     for (const product of products) {
  //       const query = `
  //         INSERT INTO item (ten_vat_pham, gia_niem_yet, so_luong_kha_dung, category)
  //         VALUES (@tenVatPham, @giaNiemYet, @soLuongKhaDung, @category)
  //       `;
  //       await transaction.request()
  //         .input('tenVatPham', sql.NVarChar, product.ten_vat_pham)
  //         .input('giaNiemYet', sql.Decimal, product.gia_niem_yet)
  //         .input('soLuongKhaDung', sql.Int, product.so_luong_kha_dung)
  //         .input('category', sql.NVarChar, product.category)
  //         .query(query);
  //     }

  //     await transaction.commit();
  //     return { success: true };
  //   } catch (error) {
  //     console.error('Error in bulkAddProducts:', error.message);
  //     throw new Error('Lỗi khi thêm sản phẩm hàng loạt.');
  //   }
  // },

};

module.exports = Product;
