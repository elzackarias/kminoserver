var express = require('express');
const app = express();
const cors = require('cors');
const argon2 = require('argon2');
const mysqlConnection = require('../src/db/database.js');
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(cors());
app.use(express.json())
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }))
app.use(function (req, res, next) {
   res.setHeader('X-Powered-By', 'Zackbyte')
   next()
})

app.get('/', function (req, res) {
   res.send('<h1>Its workingg</h1><br><a href="/info">Info</a>');
});

app.post('/setCoords', function (req, res, next) {
   console.log(req.body);
   res.json(req.body)
});

app.get('/route/:id', function (req, res, next) {
   const route_id = req.params.id;
   res.send(route_id)
})

app.get('/routes', function (req,res,next){
   mysqlConnection.query('SELECT id,name FROM rutas', async (err,rows,fields) => {
      let rutas = [];
      if(!err){
         for (let index = 0; index < rows.length; index++) {
            rutas.push(rows[index])
         }
         res.json({rutas})
      }else{
         res.json({
            status: 'Error',
            msg: 'Chale, algo salió mal'
         })
      }
   });
});

app.post('/login', function (req, res, next) {
   if (req.body.email === 'undefined' || req.body.password === 'undefined') {
      res.json({
         status: 'Error',
         msg: 'Bad Request'
      })
   } else {
      mysqlConnection.query('SELECT password,id,name FROM usuarios WHERE email = ?', [req.body.email], async (err, rows, fields) => {
         if (!err) {
            if (rows.length == 0) {
               res.json({
                  status: 'Error',
                  msg: 'El usuario no existe :('
               })
            } else {
               try {
                  const verificar = await argon2.verify(rows[0].password, req.body.password);
                  if (verificar) {
                     res.json({
                        status: 'Ok',
                        id: rows[0].id,
                        email: req.body.email,
                        name: rows[0].name
                     })
                  } else {
                     res.json({
                        status: 'Error',
                        msg: 'Contraseña incorrecta xd'
                     })
                  }
               } catch (err) {
                  res.json({
                     status: 'Error',
                     msg: 'Ocurrió lo siguiente: ' + err
                  })
               }
            }
         } else {
            res.json({
               status: 'Error',
               msg: 'Ocurrió lo siguiente: ' + err
            })
         }
      })
   }
});

app.post('/register', async function (req, res, next) {
   if (req.body.email === 'undefined' || req.body.password === 'undefined') {
      res.json({
         status: 'Error',
         msg: 'Bad Request'
      })
   } else {
      //Hashea la contraseña
      try {
         const hash = await argon2.hash(req.body.password);

         //Comprobamos si existe el correo en la base de datos
         mysqlConnection.query('SELECT id FROM usuarios WHERE email = ?', [req.body.email], async (err, rows, fields) => {
            if (!err) {
               if (rows.length == 0) {
                  //Si no existe se registra
                  var sql = "INSERT INTO usuarios (name, email, password) VALUES ('" + req.body.name + "','" + req.body.email + "','" + hash + "')";
                  mysqlConnection.query(sql, function (err, result) {
                     if (!err) {
                        res.json({
                           status: 'Ok',
                           msg: 'Usuario registrado'
                        })
                     } else {
                        res.json({
                           status: 'Error',
                           msg: 'Error en el servidor'
                        })
                     }
                  });
               } else {
                  //Si se encuentra que el correo existe
                  res.json({
                     status: 'Error',
                     msg: 'El correo electrónico ingresado ya está registrado'
                  })
               }
            } else {
               res.json({
                  status: 'Error',
                  msg: 'Ocurrió lo siguiente: ' + err
               })
            }
         })

      } catch (err) {
         res.json({
            status: 'Error',
            msg: 'Hubo un error en el hasheo'
         })
      }

   }
});

app.get('/info', function (req, res) {
   res.send('<h1>Bienvenido al servidor de Kmino</h1><br/><span>Este proyecto no seria posible sin la ayuda de proyectos como:</span><br><ul><li>Google Maps API</li><li>Socket.io</li></ul><h4>Por: Jose Zacarias & el poder de NodeJS y PHP</h4><a href="/">Inicio</a>');
})

var Combis = new Array();
//Whenever someone connects this gets executed
io.on('connection', function (socket) {
   console.log('A user connected');

   //This function update de location in the react native app, virtualDOM
   socket.on("updateLocation", (coords) => {
      if (coords.os == 'xandroid') { //Filter the OS from this goes, (optional)
         console.log(coords)
         io.emit("coords", coords)
      }
   })

   const msg = {
      status: "Error",
      msg: "Ocurrio un error en el servidor (Something was wrong:c)"
   }
   socket.on("Error", () => {
      io.emit("Error", msg)
   })

   //Whenever someone disconnects this piece of code executed
   socket.on('disconnect', function () {
      console.log('A user disconnected');
   });
});

http.listen(3000, function () {
   console.log('listening on *:3000');
});
