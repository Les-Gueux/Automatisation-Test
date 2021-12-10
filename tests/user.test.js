const request = require('supertest')
const app = require('../app')

test('ping serv', async () =>{
    await request(app).get('')
    .expect(200)
})

/* test('should login user', async () =>{
    await request(app).post('/users/login/')
    .send({
        email: 'pierre@gmail.com',
        password:'12345'
    })
    .expect(200)
}) */