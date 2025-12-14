-- Active: 1765454929840@@127.0.0.1@5432@guana_posts_api@public
use guana_posts_api;

show tables;

select * from categories;

INSERT INTO
    user (name, email, password, `createdAt`, `updatedAt`)
VALUES (
        "Manele",
        "manele@cdci.com",
        "12345678",
        NOW(),
        NOW()
    );

INSERT INTO
    categories (name)
VALUES ('Animais'),
    ('Arquitetura'),
    ('Arte'),
    ('Beleza'),
    ('Cidades'),
    ('Ciência'),
    ('Comida'),
    ('Cultura'),
    ('Design'),
    ('Educação'),
    ('Entretenimento'),
    ('Esportes'),
    ('Eventos'),
    ('Fotografia'),
    ('História'),
    ('Jogos'),
    ('Lazer'),
    ('Moda'),
    ('Música'),
    ('Negócios'),
    ('Natureza'),
    ('Pessoas'),
    ('Saúde'),
    ('Tecnologia'),
    ('Transportes'),
    ('Viagens');