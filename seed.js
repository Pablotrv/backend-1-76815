require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const User = require('./src/models/User');

const products = [
  { name: 'Laptop Pro 15"', description: 'Laptop de alto rendimiento', price: 1299.99, stock: 15, category: 'Electrónica', image: 'https://via.placeholder.com/300' },
  { name: 'Auriculares Bluetooth', description: 'Sonido premium inalámbrico', price: 89.99, stock: 50, category: 'Electrónica', image: 'https://via.placeholder.com/300' },
  { name: 'Teclado Mecánico', description: 'Teclado gaming RGB', price: 149.99, stock: 30, category: 'Accesorios', image: 'https://via.placeholder.com/300' },
  { name: 'Mouse Inalámbrico', description: 'Mouse ergonómico sin cables', price: 45.00, stock: 40, category: 'Accesorios', image: 'https://via.placeholder.com/300' },
  { name: 'Monitor 27" 4K', description: 'Monitor UHD para profesionales', price: 499.99, stock: 10, category: 'Electrónica', image: 'https://via.placeholder.com/300' },
  { name: 'Mochila Tech', description: 'Mochila para laptop 15"', price: 59.99, stock: 25, category: 'Accesorios', image: 'https://via.placeholder.com/300' },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB...');

    await Product.deleteMany({});
    await User.deleteMany({});

    await Product.insertMany(products);
    console.log(`✅ ${products.length} productos insertados.`);

    const admin = await User.create({ name: 'Admin', email: 'admin@tienda.com', password: 'admin123', role: 'admin' });
    const user = await User.create({ name: 'Cliente Demo', email: 'cliente@tienda.com', password: 'cliente123' });
    console.log('✅ Usuarios creados:');
    console.log('   Admin:   admin@tienda.com / admin123');
    console.log('   Cliente: cliente@tienda.com / cliente123');

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

seed();
