module.exports = function(app) {
    app.get('/pagamentos', function(req, res) {
        res.send('pagamentos');
    });

    app.get('/pagamentos/pagamento/:id', function(req, res) {
        
        var id = req.params.id; //para pegar os parametros da requisição
        console.log("Consultando pagamento: " + id);

        var con = app.persistencia.connectionFactory();
        var pagamentoDAO = new app.persistencia.PagamentoDAO(con);

        pagamentoDAO.buscaPorId(id, function(erro, result) {
            if (erro) {
                console.log("Erro ao consultar no banco: " + erro);
                res.status(500).send(erro);
                return;
            }
            console.log("Pagamento encontrado " + JSON.stringify(result));
            res.json(result);
            return;
        });

    });

    app.delete('/pagamentos/pagamento/:id', function(req, res) {
        var pagamento = {};
        var id = req.params.id;

        pagamento.id = id;
        pagamento.status= 'CANCELADO';

        var con = app.persistencia.connectionFactory();
        var pagamentoDAO = new app.persistencia.PagamentoDAO(con);

        pagamentoDAO.atualiza(pagamento, function(erro) {
            if (erro) {
                res.status(500).send(erro);
                return;
            }
            console.log('Pagamento cancelado');
            res.status(204).send(pagamento);
        })
    });

    app.put('/pagamentos/pagamento/:id', function(req, res) {
        
        var pagamento = {};
        var id = req.params.id;

        pagamento.id = id;
        pagamento.status= 'CONFIRMADO';

        var con = app.persistencia.connectionFactory();
        var pagamentoDAO = new app.persistencia.PagamentoDAO(con);

        pagamentoDAO.atualiza(pagamento, function(erro) {
            if (erro) {
                res.status(500).send(erro);
                return;
            }
            console.log('Pagamento confirmado');
            res.send(pagamento);
        })

    });
    
    app.post('/pagamentos/pagamento', function(req, res) {

        req.assert("pagamento.forma_de_pagamento", "Forma de Pagamento é obrigatória").notEmpty();
        req.assert("pagamento.valor", "Valor é obrigatório e deve ser um decimal").notEmpty().isFloat();

        var erros = req.validationErrors();
        if (erros) {
            console.log("Erros de validação encontrados!");
            res.status(400).send(erros);
            return;
        }

        var pagamento = req.body["pagamento"];
        console.log('Processando novo pagamento...');

        pagamento.status = 'CRIADO';
        pagamento.data = new Date;

        var con = app.persistencia.connectionFactory();
        var pagamentoDAO = new app.persistencia.PagamentoDAO(con); //nunca esquecer de dar new na classe

        pagamentoDAO.salva(pagamento, function(err, result) {
            if (err) {
                console.log('Erro ao inserir no banco: ' + err);
                res.status(500).send(err);
            } else {
                pagamento.id = result.insertId;
                console.log('Pagamento criado');

                if (pagamento.forma_de_pagamento == 'cartao') {
                    var cartao = req.body["cartao"];
                    console.log(cartao);

                    var clienteCartoes = new app.servicos.clienteCartoes();

                    clienteCartoes.autoriza(cartao, function(exception, request, response, retorno) {

                        if (exception) {
                            console.log(exception);
                            res.status(400).send(exception);
                            return;
                        }

                        res.location('/pagamentos/pagamento/' + pagamento.id);

                        var response = {
                            dados_do_pagamento: pagamento,
                            cartao: retorno,
                            
                            links: [
                                {
                                    href: "http://localhost:3000/pagamentos/pagamento/" + pagamento.id, 
                                    rel: "confirmar",
                                    method: "PUT"
                                },
                                {
                                    href: "http://localhost:3000/pagamentos/pagamento/" + pagamento.id, 
                                    rel: "cancelar",
                                    method: "DELETE"
                                }
                            ]
                        }

                        res.status(201).json(response);
                        return;
                    });
                    
                } else {

                    res.location('/pagamentos/pagamento/' + pagamento.id);

                    var response = {
                        dados_do_pagamento: pagamento,
                        links: [
                            {
                                href: "http://localhost:3000/pagamentos/pagamento/" + pagamento.id, 
                                rel: "confirmar",
                                method: "PUT"
                            },
                            {
                                href: "http://localhost:3000/pagamentos/pagamento/" + pagamento.id, 
                                rel: "cancelar",
                                method: "DELETE"
                            }
                        ]
                    }
                    res.status(201).json(response);
                }
            }
        });
    });
}

/* 

100 - conexão continuada

200 - OK
201 - criado

301 - redirecionamento
302

400 Bad Request - erro de entrada de dados(cliente)
403
404 No Found

500 - erro interno do servidor
503

*/
