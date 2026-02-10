-- 게시판 카테고리 초기 데이터
-- 실행: MySQL/MariaDB에서 직접 실행

INSERT INTO post_category (category_code, category_name, description, display_order, created_at, updated_at)
VALUES
    ('free', '자유게시판', '자유롭게 이야기를 나눠보세요', 1, NOW(), NOW()),
    ('question', '질문게시판', '궁금한 점을 질문해보세요', 2, NOW(), NOW()),
    ('info', '정보공유', '유용한 정보를 공유해주세요', 3, NOW(), NOW()),
    ('review', '후기게시판', '서비스 이용 후기를 남겨주세요', 4, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    category_name = VALUES(category_name),
    description = VALUES(description),
    display_order = VALUES(display_order);
