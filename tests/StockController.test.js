const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

const { v4: uuidv4 } = require('uuid'); 

const request = require('supertest');
const app = require('../app');

const secretKey = process.env.SECRET_KEY;

describe('StockController', () => {
  let user;
  let token;
  let ingredientId;

  beforeAll(async () => {
    await prisma.tbUsuario.deleteMany({ where: { email: 'teste@teste.com' } });

    user = await prisma.tbUsuario.create({
      data: {
        id: uuidv4(),
        nome: 'Usuário Teste',
        email: 'teste@teste.com',
        senha: '12345678',
        telefone: '(88) 9 9999-9999', 
        perfil: 'SUPERVISOR_SENIOR' 
      }
    });

    token = 'Bearer ' + jwt.sign(
      { id: user.id },
      secretKey,
      { expiresIn: 1200 }
    );
  });

  afterAll(async () => {
    if (user?.id) {
      await prisma.tbUsuario.delete({ where: { id: user.id } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  const mockIngredient = {
    nome: 'Farinha de Trigo',
    unidades: 10,
    pesoPorUnidade: 1,
    unidadeMedida: 'kg',
    validade: '2025-12-31',
    nivelMinimo: 5,
    precoCusto: 2.5,
    categoria: 'Grãos'
  };

  test('POST /super/estoque - deve adicionar um novo ingrediente', async () => {
    const res = await request(app)
      .post('/api_confeitaria/super/estoque')
      .set('Authorization', token)
      .send(mockIngredient);

    expect(res.statusCode).toBe(201);
    expect(res.body.msg).toBe("Ingrediente adicionado com sucesso!");
  });

  test('GET /super/estoque - deve retornar a lista de ingredientes', async () => {
    const res = await request(app)
      .get('/api_confeitaria/super/estoque')
      .set('Authorization', token);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.ingredients)).toBe(true);

    if (res.body.ingredients.length > 0) {
      ingredientId = res.body.ingredients[0].id;
    }
  });

  test('GET /super/estoque/ingrediente/:id - deve retornar um ingrediente pelo ID', async () => {
    if (!ingredientId) return;

    const res = await request(app)
      .get(`/api_confeitaria/super/estoque/ingrediente/${ingredientId}`)
      .set('Authorization', token);

    expect(res.statusCode).toBe(200);
    expect(res.body.produto).toHaveProperty('nome');
  });

  test('PUT /super/estoque/ingrediente/:id - deve atualizar o ingrediente', async () => {
    if (!ingredientId) return;

    const res = await request(app)
      .put(`/api_confeitaria/super/estoque/ingrediente/${ingredientId}`)
      .set('Authorization', token)
      .send({ precoCusto: 3.0 });

    expect(res.statusCode).toBe(200);
    expect(res.body.ingredient.precoCusto).toBe(3.0);
  });

  test('DELETE /super/estoque/ingrediente/:id - deve deletar o ingrediente', async () => {
    if (!ingredientId) return;

    const res = await request(app)
      .delete(`/api_confeitaria/super/estoque/ingrediente/${ingredientId}`)
      .set('Authorization', token);

    expect(res.statusCode).toBe(200);
    expect(res.body.msg).toBe('Produto excluído com sucesso!');
  });

});
