const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'henrique@260105',
  database: 'psicologo_db'
});

db.connect(err => {
  if (err) {
    console.error('Erro ao conectar com o banco:', err);
  } else {
    console.log('Conectado ao MySQL!');
  }
});

app.get('/', (req, res) => {
  res.send('API do sistema de psicólogos funcionando');
});

app.get('/pacientes', (req, res) => {
  db.query('SELECT * FROM pacientes', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

app.post('/pacientes', (req, res) => {
  const { nome, email, telefone } = req.body;
  db.query(
    'INSERT INTO pacientes (nome, email, telefone) VALUES (?, ?, ?)',
    [nome, email, telefone],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: 'Paciente cadastrado com sucesso!' });
    }
  );
});

app.get('/pacientes/nome/:nome', (req, res) => {
  const nome = req.params.nome;

  db.query('SELECT id FROM pacientes WHERE nome = ?', [nome], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (results.length === 0) return res.status(404).json({ message: 'Paciente não encontrado' });

    res.json({ id: results[0].id });
  });
});

app.post('/consultas', (req, res) => {
  const { nomePaciente, data, hora, status } = req.body;

  db.query('SELECT id FROM pacientes WHERE nome = ?', [nomePaciente], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (results.length === 0) return res.status(404).json({ message: 'Paciente não encontrado' });

    const paciente_id = results[0].id;

    db.query(
      'INSERT INTO consultas (paciente_id, data, hora, status) VALUES (?, ?, ?, ?)',
      [paciente_id, data, hora, status],
      (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Consulta agendada com sucesso!' });
      }
    );
  });
});

app.put('/consultas/:id/status', (req, res) => {
  const { status, observacao_remarcacao } = req.body;
  const consultaId = req.params.id;

  db.query(
    'UPDATE consultas SET status = ?, observacao_remarcacao = ? WHERE id = ?',
    [status, observacao_remarcacao, consultaId],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: 'Status da consulta atualizado com sucesso!' });
    }
  );
});

app.post('/pagamentos', (req, res) => {
  const { paciente_id, valor, data_pagamento, forma_pagamento, status } = req.body;

  db.query(
    'INSERT INTO pagamentos (paciente_id, valor, data_pagamento, forma_pagamento, status) VALUES (?, ?, ?, ?, ?)',
    [paciente_id, valor, data_pagamento, forma_pagamento, status],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: 'Pagamento registrado com sucesso!' });
    }
  );
});

app.post('/prontuarios', (req, res) => {
  const { paciente_id, data, descricao, observacoes } = req.body;

  db.query(
    'INSERT INTO prontuarios (paciente_id, data, descricao, observacoes) VALUES (?, ?, ?, ?)',
    [paciente_id, data, descricao, observacoes],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: 'Prontuário salvo com sucesso!' });
    }
  );
});

app.post('/evolucao', (req, res) => {
  const { paciente_id, data, descricao, nivel_avanco } = req.body;

  db.query(
    'INSERT INTO evolucoes (paciente_id, data, descricao, nivel_avanco) VALUES (?, ?, ?, ?)',
    [paciente_id, data, descricao, nivel_avanco],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: 'Evolução registrada com sucesso!' });
    }
  );
});

app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ message: 'E-mail e senha são obrigatórios' });
  }

  db.query('SELECT * FROM psicologos WHERE email = ?', [email], (err, results) => {
    if (err) {
      console.error('Erro ao consultar o banco:', err);
      return res.status(500).json({ message: 'Erro interno no servidor' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'E-mail ou senha inválidos' });
    }

    const psicologo = results[0];

    bcrypt.compare(senha, psicologo.senha, (err, isMatch) => {
      if (err) {
        console.error('Erro ao comparar senha:', err);
        return res.status(500).json({ message: 'Erro interno no servidor' });
      }

      if (isMatch) {
        return res.json({ message: 'Login bem-sucedido', userId: psicologo.id });
      } else {
        return res.status(401).json({ message: 'E-mail ou senha inválidos' });
      }
    });
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

app.post('/psicologos', async (req, res) => {
  const { nome, email, senha } = req.body;

  try {
    const hash = await bcrypt.hash(senha, 10);

    db.query(
      'INSERT INTO psicologos (nome, email, senha) VALUES (?, ?, ?)',
      [nome, email, hash],
      (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Psicólogo cadastrado com sucesso!' });
      }
    );
  } catch (err) {
    res.status(500).json({ message: 'Erro ao cadastrar o psicólogo', error: err });
  }
});

app.get('/pacientes/ordenados', (req, res) => {
  db.query('SELECT * FROM pacientes ORDER BY nome ASC', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

app.get('/prontuarios/:paciente_id', (req, res) => {
  const paciente_id = req.params.paciente_id;

  db.query(
    'SELECT * FROM prontuarios WHERE paciente_id = ? ORDER BY data DESC',
    [paciente_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json(results);
    }
  );
});

app.get('/evolucoes/:paciente_id', (req, res) => {
  const paciente_id = req.params.paciente_id;

  db.query(
    'SELECT * FROM evolucoes WHERE paciente_id = ? ORDER BY data DESC',
    [paciente_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json(results);
    }
  );
});

app.put('/prontuarios/:id', (req, res) => {
  const { descricao, observacoes, data } = req.body;
  const id = req.params.id;

  db.query(
    'UPDATE prontuarios SET descricao = ?, observacoes = ?, data = ? WHERE id = ?',
    [descricao, observacoes, data, id],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: 'Prontuário atualizado com sucesso!' });
    }
  );
});

app.delete('/prontuarios/:id', (req, res) => {
  const id = req.params.id;

  db.query('DELETE FROM prontuarios WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Prontuário deletado com sucesso!' });
  });
});

app.put('/evolucoes/:id', (req, res) => {
  const { descricao, nivel_avanco, data } = req.body;
  const id = req.params.id;

  db.query(
    'UPDATE evolucoes SET descricao = ?, nivel_avanco = ?, data = ? WHERE id = ?',
    [descricao, nivel_avanco, data, id],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: 'Evolução atualizada com sucesso!' });
    }
  );
});

app.delete('/evolucoes/:id', (req, res) => {
  const id = req.params.id;

  db.query('DELETE FROM evolucoes WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Evolução deletada com sucesso!' });
  });
});

app.delete('/consultas/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM consultas WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.sendStatus(200);
  });
});

app.get('/pacientes-com-consultas', (req, res) => {
  const sql = `
    SELECT p.id as paciente_id, p.nome, p.status,
           c.id as consulta_id, c.data, c.hora, c.status as status_consulta
    FROM pacientes p
    LEFT JOIN consultas c ON c.paciente_id = p.id
    ORDER BY p.nome ASC, c.data DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).send(err);

    const agrupado = {};

    results.forEach(row => {
      const id = row.paciente_id;

      if (!agrupado[id]) {
        agrupado[id] = {
          id,
          nome: row.nome,
          status: row.status,
          consultas: []
        };
      }

      if (row.consulta_id) {
        agrupado[id].consultas.push({
          id: row.consulta_id,
          data: row.data,
          hora: row.hora,
          status: row.status_consulta
        });
      }
    });

    const pacientesComConsultas = Object.values(agrupado);
    res.json(pacientesComConsultas);
  });
});
    res.json(Object.values(agrupado));

app.get('/consultas', (req, res) => {
  db.query('SELECT * FROM consultas', (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

app.post('/consultas', (req, res) => {
  const { nome_paciente, data, hora, status } = req.body;
  db.query(
    'INSERT INTO consultas (nome_paciente, data, hora, status) VALUES (?, ?, ?, ?)',
    [nome_paciente, data, hora, status],
    (err) => {
      if (err) return res.status(500).send(err);
      res.json({ message: 'Consulta adicionada com sucesso' });
    }
  );
});

app.put('/consultas/:id', (req, res) => {
  const { nome_paciente, data, hora, status } = req.body;
  db.query(
    'UPDATE consultas SET nome_paciente = ?, data = ?, hora = ?, status = ? WHERE id = ?',
    [nome_paciente, data, hora, status, req.params.id],
    (err) => {
      if (err) return res.status(500).send(err);
      res.json({ message: 'Consulta atualizada com sucesso' });
    }
  );
});

app.delete('/consultas/:id', (req, res) => {
  db.query('DELETE FROM consultas WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).send(err);
    res.json({ message: 'Consulta excluída' });
  });
});

app.listen(3001, () => {
  console.log('Servidor rodando em http://localhost:3001');
});
window.addEventListener('DOMContentLoaded', () => {
  fetch('http://localhost:3001/pacientes') 
    .then(res => res.json())
    .then(pacientes => {
      const select = document.getElementById('paciente_id');
      pacientes.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = p.nome;
        select.appendChild(option);
      });
    })
    .catch(err => console.error('Erro ao buscar pacientes:', err));
});