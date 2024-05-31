/*
  Warnings:

  - You are about to drop the `classroom` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `extracurricular_activity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `parent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `password_reset_tokens` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `students` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subject` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `teacher` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `timetable` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'TEACHER', 'PARENT', 'ADMIN');

-- DropForeignKey
ALTER TABLE "parent" DROP CONSTRAINT "parent_studentid_fkey";

-- DropForeignKey
ALTER TABLE "parent" DROP CONSTRAINT "parent_userid_fkey";

-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_classroomid_fkey";

-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_userid_fkey";

-- DropForeignKey
ALTER TABLE "teacher" DROP CONSTRAINT "teacher_classroomid_fkey";

-- DropForeignKey
ALTER TABLE "teacher" DROP CONSTRAINT "teacher_subjectid_fkey";

-- DropForeignKey
ALTER TABLE "teacher" DROP CONSTRAINT "teacher_userid_fkey";

-- DropForeignKey
ALTER TABLE "timetable" DROP CONSTRAINT "timetable_classroomid_fkey";

-- DropForeignKey
ALTER TABLE "timetable" DROP CONSTRAINT "timetable_subjectid_fkey";

-- DropForeignKey
ALTER TABLE "timetable" DROP CONSTRAINT "timetable_teacherid_fkey";

-- DropTable
DROP TABLE "classroom";

-- DropTable
DROP TABLE "extracurricular_activity";

-- DropTable
DROP TABLE "parent";

-- DropTable
DROP TABLE "password_reset_tokens";

-- DropTable
DROP TABLE "students";

-- DropTable
DROP TABLE "subject";

-- DropTable
DROP TABLE "teacher";

-- DropTable
DROP TABLE "timetable";

-- DropTable
DROP TABLE "users";

-- DropEnum
DROP TYPE "user_role";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firstName" VARCHAR(255) NOT NULL,
    "lastName" VARCHAR(255) NOT NULL,
    "idNumber" VARCHAR(255),
    "dateOfBirth" TIMESTAMP(3),
    "gender" VARCHAR(10),
    "email" VARCHAR(255) NOT NULL,
    "phoneNumber" VARCHAR(20),
    "addressId" VARCHAR(36),
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "password" VARCHAR(255) NOT NULL,
    "bio" TEXT,
    "profilePicture" BYTEA,
    "schoolId" VARCHAR(36),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "stateProvince" TEXT,
    "country" TEXT,
    "postalCode" TEXT,
    "faxNumber" TEXT,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phoneNumber" TEXT,
    "website" TEXT,
    "missionStatement" TEXT,
    "totalStudents" INTEGER,
    "enrollmentCapacity" INTEGER,
    "staffCount" INTEGER,
    "logo" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Classroom" (
    "id" TEXT NOT NULL,
    "classNumber" VARCHAR(10),
    "grade" INTEGER,
    "schoolId" VARCHAR(36),

    CONSTRAINT "Classroom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "userId" VARCHAR(36),
    "classroomId" VARCHAR(36),
    "schoolId" VARCHAR(36),

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parent" (
    "id" TEXT NOT NULL,
    "userId" VARCHAR(36),
    "studentId" VARCHAR(36),
    "schoolId" VARCHAR(36),

    CONSTRAINT "Parent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teacher" (
    "id" TEXT NOT NULL,
    "userId" VARCHAR(36),
    "classroomId" VARCHAR(36),
    "subjectId" VARCHAR(36),
    "schoolId" VARCHAR(36),

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtracurricularActivity" (
    "id" TEXT NOT NULL,
    "activityName" VARCHAR(255),
    "teacher" VARCHAR(255),
    "description" TEXT,
    "startDate" DATE,
    "endDate" DATE,
    "schoolId" VARCHAR(36),

    CONSTRAINT "ExtracurricularActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "subjectName" VARCHAR(255),
    "classroomId" VARCHAR(36),

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ExtracurricularActivityToStudent" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "School_email_key" ON "School"("email");

-- CreateIndex
CREATE UNIQUE INDEX "_ExtracurricularActivityToStudent_AB_unique" ON "_ExtracurricularActivityToStudent"("A", "B");

-- CreateIndex
CREATE INDEX "_ExtracurricularActivityToStudent_B_index" ON "_ExtracurricularActivityToStudent"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parent" ADD CONSTRAINT "Parent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Parent" ADD CONSTRAINT "Parent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Parent" ADD CONSTRAINT "Parent_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ExtracurricularActivity" ADD CONSTRAINT "ExtracurricularActivity_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "_ExtracurricularActivityToStudent" ADD CONSTRAINT "_ExtracurricularActivityToStudent_A_fkey" FOREIGN KEY ("A") REFERENCES "ExtracurricularActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExtracurricularActivityToStudent" ADD CONSTRAINT "_ExtracurricularActivityToStudent_B_fkey" FOREIGN KEY ("B") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
