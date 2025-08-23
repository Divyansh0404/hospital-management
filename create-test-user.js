const bcrypt = require('bcryptjs');

// This is the password hash for "admin123"
const createTestUser = async () => {
  const saltRounds = 10;
  const password = "admin123";
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  
  console.log("Test User Credentials:");
  console.log("Email: admin@hospital.com");
  console.log("Password: admin123");
  console.log("Hashed Password:", hashedPassword);
  
  const testUser = {
    username: "admin",
    email: "admin@hospital.com",
    password: hashedPassword,
    employeeId: "EMP001",
    role: "Admin",
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  console.log("\nUser Object to insert:");
  console.log(JSON.stringify(testUser, null, 2));
};

createTestUser();
