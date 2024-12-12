const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const fileUpload = require('express-fileupload');
const file = {
    useTempFiles: true,
    tempFileDir: ''
}

/*-----------------------------------------READ---------------------------------------*/
//Hiển thị danh sách toàn bộ sản phẩm, bao gồm sách, báo, và văn phòng phẩm.
router.get('/dashboard',productController.getAllProducts); 
//Hiển thị chi tiết một sản phẩm cụ thể.
router.get('/:id',productController.getProductById);  
// sắp xếp theo tên hoặc số lượng khả dụng
router.get('/sorted',productController.getSortedProducts);  
// Tìm kiếm bằng tên một sản phẩm cụ thể 
router.get('/search', productController.getSearchedProducts);  
// lọc theo danh mục
router.get('/filter',productController.getFilteredByCategory) 


/*-----------------------------------------CREATE-------------------------------------*/
// thêm sản phẩm theo danh mục bởi admin
router.post('/create',productController.addProduct);
// // thêm sản phẩm bằng file
// router.post('/import-excel',fileUpload('file'),productController.bulkUpdate); 

/*-----------------------------------------UPDATE-------------------------------------*/
//cập nhập thông tin sản phẩm 
router.put('/edit',productController.updateProducts); 

/*-----------------------------------------DELETE---------------------------------------*/
// Xóa một sản phẩm khỏi cơ sở dữ liệu thông qua ID.
router.delete('/deleteID/:id',productController.deleteProductById);

/*                                               END CODE                                           */
module.exports = router;

