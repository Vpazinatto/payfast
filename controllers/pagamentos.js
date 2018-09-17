module.exports = function(app) {
    app.get('/pagamentos', function(req, res) {
        res.send('pagamentos');
    });

    app.post('/pagamentos/pagamento', function(req, res) {
        var pagamento = req.body;
        console.log('Processando novo pagamento...');

        pagamento.status = 'CRIADO';
        pagamento.data = new Date;

        var con = app.persistencia.connectionFactory();
        var pagamentoDAO = app.persistencia.PagamentoDAO(con);

        pagamentoDAO.salva(pagamento, function(err, result) {
            console.log('pagamento criado');
            res.json(pagamento);
        });
    });
}
