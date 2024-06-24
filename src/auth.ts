import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import express from "express";
import { env } from "process";
import crypto from "crypto";
import nodemailer, { SendMailOptions, Transporter } from "nodemailer";
import { PassThrough } from "stream";

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
  otp: string
): Promise<unknown> => {
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

  const mailOptions = {
    from: "School Management System <no-reply@schoolms.com>",
    to,
    subject: "School Management System OTP Code",
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
  const fullYear = currentYear - (currentYear % 100) + year;
  const dateOfBirth = new Date(fullYear, month, day);

  const formattedDateOfBirth = `${dateOfBirth.getFullYear()}-${(
    dateOfBirth.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}-${dateOfBirth.getDate().toString().padStart(2, "0")}`;

  const genderDigit = idNumber.charAt(6);
  const gender = genderDigit === "0" ? "Female" : "Male";

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

      await sendOTPEmail(representativeEmail, otp);
      res
        .status(200)
        .json({
          message:
            "A verification email has been sent to your email. Please check your email and verify your account to proceed.",
          success: true,
        });
    }
  } catch (error) {
    console.log("error => ", error);
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

        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        console.log(isPasswordValid)
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

    return res.status(400).json({
      message: "Invalid update type specified.",
      success: false,
    });

  } catch (error) {
    console.error("Update error:", error);
    return res.status(500).json({
      message: `Update failed: ${error.message}`,
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

export default router;
