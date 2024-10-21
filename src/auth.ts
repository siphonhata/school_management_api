import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import express from "express";
import { env } from "process";
import crypto from "crypto";
import nodemailer, { Transporter } from "nodemailer";

let globalSchoolId = null;


// Function to set the global school ID
const setGlobalSchoolId = (schoolId) => {
  globalSchoolId = schoolId;
};

// Function to get the global school ID
const getGlobalSchoolId = () => {
  return globalSchoolId;
};

function generatePassword(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:,.<>?';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

const router = express.Router();
const otpExpiryMinutes = process.env.OTP_EXPIRY_MINUTE;
const secret = process.env.ACCESS_TOKEN_SECRET as string;
const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}

const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const transporter: Transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendOTPEmail = async (
  to: string,
  subject: string,
  htmlContent: string
): Promise<unknown> => {


  const mailOptions = {
    from: "School Management System <no-reply@schoolms.com>",
    to,
    subject: subject,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    return Promise.resolve;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const sendVerificationEmail = async (toEmail: string) => {
  try {
    const htmlContent = `
    <html>
      <head>
        <title>School Management System - Account Verified</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5; /* Light gray background */
          }
          h1 {
            color: #3498db; /* Blue heading */
            font-size: 24px;
            margin-bottom: 10px;
            text-align: center;
          }
          p {
            color: #2c3e50; /* Darker gray text */
            font-size: 16px;
            line-height: 1.5;
            text-align: center;
          }
          .button {
            background-color: #3498db; /* Same blue as heading */
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            text-align: center;
            margin-top: 20px;
            display: inline-block;
            text-decoration: none;
          }
          .button:hover {
            background-color: #2980b9; /* Darker blue on hover */
          }
        </style>
      </head>
      <body>
        <h1>Welcome to School Management System!</h1>
        <p>Your account has been successfully verified.</p>
        <p>You can now access all features of the platform.</p>
        <a href="http://http://localhost:3000/signin" class="button">Go to Login Page</a>
        <p>Thank you for joining us!</p>
      </body>
    </html>
  `;
    const mailOptions = {
      from: "School Management System <no-reply@schoolms.com>",
      to: toEmail,
      subject: "School Management System - Account Verified",
      html: htmlContent,
    };

    // Send the email using the configured transporter
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error; // Re-throw error for handling in calling code
  }
};

const extractDoB = (idNumber: string) => {
  const dateOfBirthString = idNumber.substr(0, 6);
  const year = parseInt(dateOfBirthString.substr(0, 2), 10);
  const month = parseInt(dateOfBirthString.substr(2, 2), 10) - 1;
  const day = parseInt(dateOfBirthString.substr(4, 2), 10);

  const currentYear = new Date().getFullYear();
  const currentCentury = Math.floor(currentYear / 100) * 100;
  let fullYear: any;

  // Determine the full year based on the first two digits of the year part
  if (year >= 0 && year <= 23) {
    fullYear = 2000 + year;
  } else {
    // Year 1900 to 1999
    fullYear = 1900 + year;
  }

  const dateOfBirth = new Date(fullYear, month, day);

  const formattedDateOfBirth = `${dateOfBirth.getFullYear()}-${(
    dateOfBirth.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}-${dateOfBirth.getDate().toString().padStart(2, "0")}`;

  const genderDigit = parseInt(idNumber.charAt(6), 10);
  const gender = genderDigit < 5 ? "Female" : "Male";

  return { dob: formattedDateOfBirth, gender };
};
/////////////////// ENDPOINT ///////////////////////////////////
router.post("/registerAccount", async (req: any, res: any) => {
  const {
    schoolName,
    schoolEmail,
    websiteLink,
    schoolPhoneNumber,
    missionStatement,
    representativeName,
    representativeLastName,
    representativeEmail,
    password,
    representativePhoneNumber,
  } = req.body;

  try {
    const school = await prisma.school.create({
      data: {
        name: schoolName,
        email: schoolEmail,
        website: websiteLink,
        phoneNumber: schoolPhoneNumber,
        missionStatement: missionStatement,
      },
    });
    const user = await prisma.user.create({
      data: {
        firstName: representativeName,
        lastName: representativeLastName,
        email: representativeEmail,
        password: await hashPassword(password),
        schoolId: school.id,
        phoneNumber: representativePhoneNumber,
        role: "ADMIN",
      },
    });
    if (user != null && school != null) {
      const otp = generateOTP();
      const otpExpiry = new Date();
      otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

      const createdOtp = await prisma.otp.create({
        data: {
          email: representativeEmail,
          code: otp,
          expiresAt: otpExpiry,
        },
      });
      const htmlContent = `
      <html>
        <head>
          <title>School Management System OTP Code</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
            }
            h1 {
              color: #3498db; /* Blue heading */
              font-size: 24px;
              margin-bottom: 10px;
            }
            p {
              color: #2c3e50; /* Darker gray text */
              font-size: 16px;
              line-height: 1.5;
            }
            span {
              color: #e74c3c; /* Red for OTP code */
              font-weight: bold;
            }
            .footer {
              font-size: 12px;
              color: #95a5a6;
              text-align: center;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <h1>School Management System OTP Code</h1>
          <p>Here's your One-Time Password (OTP) code to verify your account:</p>
          <p>
            <span>${otp}</span>
          </p>
          <p>Please enter this code within 10 minutes to complete your verification.</p>
          <p>Thank you for using the School Management System!</p>
          <div class="footer">
            <p>Copyright &copy; ${new Date().getFullYear()} School Management System. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
      const subject = "School Management System OTP Code"
      await sendOTPEmail(representativeEmail, subject, htmlContent);
      res.status(200).json({
        message:
          "A verification email has been sent to your email. Please check your email and verify your account to proceed.",
        success: true,
      });
    }
  } catch (error) {
    console.log("ERROR: ", error)
    res.status(404).json({ error: error.message, success: false });
  }
});

router.post("/verifyOTP", async (req: any, res: any) => {
  const { email, otp } = req.body;

  try {
    const otpRecord = await prisma.otp.findFirst({ where: { email } });
    if (!otpRecord) {
      return res.status(404).json({ message: "OTP not found", success: false });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res
        .status(400)
        .json({ message: "OTP has expired", success: false });
    }

    if (otpRecord.code !== otp) {
      return res.status(400).json({ message: "Invalid OTP", success: false });
    }

    await prisma.user.update({
      where: { email },
      data: { status: "ACTIVE" },
    });

    await prisma.otp.delete({ where: { id: otpRecord.id } });

    await sendVerificationEmail(email);

    return res
      .status(200)
      .json({ message: "OTP verified successfully", success: true });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exist" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });
    }

    const payload = {
      id: user.id,
      uniqueIdentifier: Date.now().toString(),
    };
    const expiresIn = env.EXPIRY_TIME;
    const token = jwt.sign(payload, secret, { expiresIn });
    res.set("Authorization", `Bearer ${token}`);
    res.set("Access-Control-Expose-Headers", "*");

    setGlobalSchoolId(user.schoolId);

    return res.json({
      token: token,
      user: user,
      message: "Login successful",
      success: true,
    });
  } catch (error) {
    return res.status(404).json({ message: "Login failed", success: false });
  }
});

router.get("/getSchoolByID", async (req: any, res: any) => {
  const { id } = req.query;
  try {
    const school = await prisma.school.findUnique({
      where: {
        id,
      },
    });

    if (!school) {
      return res
        .status(404)
        .json({ message: "School not found", success: false });
    }

    res.status(200).json({ message: "School found", success: true, school }); // Return school object
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.put("/update", async (req: any, res: any) => {
  const { formData, type } = req.body;
  const { userInfo, address, password, school } = formData;
  const { idNumber, ...rest } = userInfo;

  const id = req?.user?.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (type === "user") {
      try {
        const updateData = {
          ...rest,
          idNumber,
        };

        if (idNumber) {
          const { dob, gender } = extractDoB(idNumber);
          updateData.dateOfBirth = dob;
          updateData.gender = gender;
        }

        const user = await prisma.user.update({
          where: { id },
          data: updateData,
        });

        return res.json({
          user,
          message: "User info update successful",
          success: true,
        });
      } catch (error) {
        console.error("User update error:", error);
        return res.status(500).json({
          message: `User update failed: ${error.message}`,
          success: false,
        });
      }
    }

    if (type === "password") {
      try {
        const { oldPassword, newPassword, confirmPassword } = password;

        if (!oldPassword || !newPassword || !confirmPassword) {
          return res.status(400).json({
            message: "Please fill in all fields.",
            success: false,
          });
        }

        if (newPassword !== confirmPassword) {
          return res.status(400).json({
            message: "New password and confirm password do not match.",
            success: false,
          });
        }

        const user = await prisma.user.findUnique({
          where: { id },
        });

        if (!user) {
          return res.status(404).json({
            message: "User not found.",
            success: false,
          });
        }

        const isPasswordValid = await bcrypt.compare(
          oldPassword,
          user.password
        );
        if (!isPasswordValid) {
          return res.status(400).json({
            message: "Current password is incorrect.",
            success: false,
          });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const updatedUser = await prisma.user.update({
          where: { id },
          data: {
            password: hashedPassword,
          },
        });

        return res.json({
          user: updatedUser,
          message: "Password update successful",
          success: true,
        });
      } catch (error) {
        console.error("Password update error:", error);
        return res.status(500).json({
          message: `Password update failed: ${error.message}`,
          success: false,
        });
      }
    }

    if (type === "address") {
      try {
        let addressId: any;

        // Create a new address
        if (!user?.addressId) {
          const newAddress = await prisma.address.create({
            data: {
              ...address,
            },
          });

          addressId = newAddress.id;
        } else {
          addressId = user.addressId;
          const updatedAddress = await prisma.address.update({
            where: { id: addressId },
            data: {
              ...address,
            },
          });


          return res.json({
            user: updatedAddress,
            message: "Address updated successfully",
            success: true,
          });
        }

        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            address: {
              connect: { id: addressId },
            },
          },
        });

        return res.json({
          user: updatedUser,
          message: "Address created successfully",
          success: true,
        });

      } catch (error) {
        return res.status(500).json({
          message: `Address operation failed: ${error.message}`,
          success: false,
        });
      }
    }


    if (type === "school") {
      try {
        const updatedSchool = await prisma.school.update({
          where: { id: user.schoolId },
          data:
          {
            ...school,
          },
        });
        return res.json({
          school: updatedSchool,
          message: "School update successful",
          success: true,
        });
      } catch (error) {
        return res.status(500).json({
          message: `Address update failed: ${error.message}`,
          success: false,
        });
      }
    }

  } catch (error) {
    return res.status(400).json({
      message: "Invalid update type specified.",
      success: false,
    });
  }
});

router.post("/create_user", async (req: any, res: any) => {
  try {
    const {
      firstName,
      lastName,
      idNumber,
      dateOfBirth,
      gender,
      email,
      phoneNumber,
      address,
      role,
      password,
      profilePicture,
    } = req.body;

    const hashedPassword = await hashPassword(password);
    const result = await prisma.user.create({
      data: {
        firstName,
        lastName,
        idNumber,
        dateOfBirth,
        gender,
        email,
        phoneNumber,
        address,
        role,
        profilePicture,
        password: hashedPassword,
      },
    });
    res.status(201).json({
      result: result,
      message: "User Created Successfully",
      success: true,
    });
  } catch (error) {
    res.status(404).send("Not found");
  }
});

router.get("/test", (req: any, res: any) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  res.json({ message: "Welcome!", user: req.user });
});

router.post("/upload", async (req: any, res: any) => {
  const { image } = req.body;
  const id = req?.user?.id;
  try {
    const buffer = Buffer.from(image, "base64");
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { profilePicture: buffer },
    });
    res.json({ message: "User image updated!", user: updatedUser });
  } catch (error) {
    res.status(404).json({ error: "Error updating user image" });
  }
});

router.get("/getuser", async (req: any, res: any) => {
  const id = req?.user?.id;
  let photo = "";
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        address: true,
        school: true,
      },
    });
    if (user && user.profilePicture) {
      photo = Buffer.from(user.profilePicture).toString("base64");
    }
    res.json({
      photo,
      user,
      message: "User successfully retrieved",
      success: true,
    });
  } catch (error) {
    res
      .status(404)
      .json({ message: `Error retrieving user ${error}`, success: false });
  }
});

router.get("/stats", async (req: any, res: any) => {
  try {

    const totalStudents = await prisma.student.count();
    const totalTeachers = await prisma.teacher.count();
    const totalParents = await prisma.parent.count();

    res.json({
      totalStudents,
      totalTeachers,
      totalParents,
      message: "stats success",
      success: true,
    });
  } catch (error) {
    res.status(404).json({ error: "Error getting stats" });
  }
});

router.post('/forgot-password', async (req: any, res: any) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return res.status(404).send('User not found');
    }
    const resetLink = `http://localhost:3000/reset-password?id=${user.id}`;
    const subject = "Important: Password Reset Request for Your Account";
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
    </head>
    <body>
        <p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
        <p>Please click on the following link, or paste this into your browser to complete the process:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
    </body>
    </html>
  `;

    await sendOTPEmail(email, subject, htmlContent);
    res.json({
      user,
      message: "Forgot-password successfully retrieved",
      success: true,
    });
  }
  catch (error) {
    res
      .status(404)
      .json({ message: `Error retrieving user ${error}`, success: false });
  }
});

router.post('/reset-password', async (req: any, res: any) => {
  const { id, newPassword, confirmPassword } = req.body;

  if (!id || !newPassword || !confirmPassword) {
    return res.status(400).send('All fields are required');
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).send('Passwords do not match');
  }

  const user = await prisma.user.findUnique({
    where: { id }
  });

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id },
    data: {
      password: hashedPassword,
    }
  });
  res.json({
    user,
    message: "Password has been reset successfully",
    success: true,
  });
});

router.post('/invite', async (req: any, res: any) => {
  const { email, firstName, lastName, role } = req.body;

  if (!email || !role) {
    return res.status(400).json({ message: 'Email, role are required.', success: false })
  }

  const password = generatePassword(8);
  const hashedPassword = await bcrypt.hash(password, 10);

  const validRoles = ['STUDENT', 'TEACHER', 'PARENT', 'ADMIN'];
  const normalizedRole = role.toUpperCase();

  if (!validRoles.includes(normalizedRole)) {
    return res.status(400).json({ error: 'Role must be either STUDENT, TEACHER, PARENT, or ADMIN.' });
  }

  try {
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: normalizedRole,
        firstName: firstName || null,
        lastName: lastName || null,
        schoolId: getGlobalSchoolId(),
      }
    });

    const htmlContent = `
<html>
  <head>
    <title>School Management System Invitation</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
      }
      h1 {
        color: #3498db; /* Blue heading */
        font-size: 24px;
        margin-bottom: 10px;
      }
      p {
        color: #2c3e50; /* Darker gray text */
        font-size: 16px;
        line-height: 1.5;
      }
      span {
        color: #e74c3c; /* Red for OTP code */
        font-weight: bold;
      }
      .footer {
        font-size: 12px;
        color: #95a5a6;
        text-align: center;
        margin-top: 20px;
      }
      .button {
        display: inline-block;
        padding: 10px 15px;
        margin: 20px 0;
        background-color: #3498db; /* Blue button */
        color: white;
        text-decoration: none;
        border-radius: 5px;
      }
    </style>
  </head>
  <body>
    <h1>Welcome to the School Management System!</h1>
    <p>You have been invited to join the School Management System for your school.</p>
    <p>Your Email Address for verification is:</p>
    <p>
      <span>${email}</span>
    </p>
    <p>Your generated password is:</p>
    <p>
      <span>${password}</span>
    </p>
    <p></p>
    <p>Click the link below for further instructions:</p>
    <p>
      <a href="https://your-school-management-system.com/instructions" class="button">Click Here for Instructions</a>
    </p>
    <p>Thank you for using the School Management System!</p>
    <div class="footer">
      <p>Copyright &copy; ${new Date().getFullYear()} School Management System. All rights reserved.</p>
    </div>
  </body>
</html>
`;
    const subject = "Invitation to the School Management System";
    await sendOTPEmail(email, subject, htmlContent);
    res.status(201).json({ newUser, message: "User created", success: true });
  }
  catch (error) {
    console.log(error)
    res.status(404).json({ message: "Error", success: false });
  }
});

export default router;
