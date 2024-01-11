const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const exphbs = require('express-handlebars').create({/* configuración opcional */});
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const socketIO = new Server(server);

const PORT = 8080;

app.use(express.json());

// Configurar Handlebars como el motor de plantillas
app.engine('handlebars', exphbs.engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Simulación de una base de datos de productos
let products = [];

// Configurar Socket.IO para manejar eventos en tiempo real
socketIO.on('connection', (socket) => {
    console.log('Usuario conectado');

    // Manejar evento de creación de producto
    socket.on('crearProducto', (nuevoProducto) => {
        products.push(nuevoProducto);
        saveProducts(); // Guardar cambios en el archivo productos.json

        // Emitir un evento para actualizar la vista 'realTimeProducts.handlebars'
        socketIO.emit('productoCreado', nuevoProducto);

        // Actualizar la vista 'home.handlebars'
        socketIO.emit('actualizarHome', products);
    });

    // Manejar evento de eliminación de producto
    socket.on('eliminarProducto', (idProducto) => {
        const index = products.findIndex((prod) => prod.id === idProducto);
        if (index !== -1) {
            products.splice(index, 1);
        }

        saveProducts(); // Guardar cambios en el archivo productos.json

        // Emitir un evento para actualizar la vista 'realTimeProducts.handlebars'
        socketIO.emit('productoEliminado', idProducto);

        // Actualizar la vista 'home.handlebars'
        socketIO.emit('actualizarHome', products);
    });

    socket.on('disconnect', () => {
        console.log('Usuario desconectado');
    });
});

// Rutas para el manejo de productos
const productsRouter = express.Router();

// Ruta para mostrar todos los productos
productsRouter.get('/', (req, res) => {
    res.render('home', { products });
});

app.use('/api/products', productsRouter);

// Rutas para el manejo de carritos
const cartsRouter = express.Router();

// Ruta para mostrar la vista en tiempo real de productos
app.get('/realtimeproducts', (req, res) => {
    res.render('realTimeProducts', { products });
});

app.use('/api/carts', cartsRouter);

server.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
