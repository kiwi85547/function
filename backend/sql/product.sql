USE prj3;

SELECT *
FROM product;

# user_id NOT NULL로 바꿔야 함
ALTER TABLE product
    MODIFY user_id INT NULL;

SELECT *
FROM product_like;

# Default 값 바꾸기
ALTER TABLE product_like
    MODIFY user_id INT NOT NULL DEFAULT 1;
