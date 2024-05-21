-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('STUDENT', 'TEACHER', 'PARENT', 'ADMIN');

-- CreateTable
CREATE TABLE "classroom" (
    "id" TEXT NOT NULL,
    "class_number" INTEGER,
    "grade" VARCHAR(10),

    CONSTRAINT "classroom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extracurricular_activity" (
    "id" TEXT NOT NULL,
    "activity_name" VARCHAR(255),
    "teacher" VARCHAR(255),
    "description" TEXT,
    "start_date" DATE,
    "end_date" DATE,

    CONSTRAINT "extracurricular_activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent" (
    "id" TEXT NOT NULL,
    "userid" VARCHAR(36),
    "studentid" VARCHAR(36),

    CONSTRAINT "parent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" VARCHAR(35) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "token" VARCHAR(255) NOT NULL,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "userid" VARCHAR(36),
    "subjects" VARCHAR(255),
    "extracurricular_activity" VARCHAR(255),
    "classroomid" VARCHAR(36),

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject" (
    "id" TEXT NOT NULL,
    "subject_name" VARCHAR(255),

    CONSTRAINT "subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher" (
    "id" TEXT NOT NULL,
    "userid" VARCHAR(36),
    "classroomid" VARCHAR(36),
    "subjectid" VARCHAR(36),
    "timetableid" VARCHAR(36),

    CONSTRAINT "teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timetable" (
    "id" TEXT NOT NULL,
    "subjectid" VARCHAR(36),
    "starttime" TIME(6),
    "endtime" TIME(6),
    "day" VARCHAR(20),
    "date" DATE,
    "type" VARCHAR(20),
    "teacherid" VARCHAR(36),
    "classroomid" VARCHAR(36),

    CONSTRAINT "timetable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "first_name" VARCHAR(255) NOT NULL,
    "last_name" VARCHAR(255) NOT NULL,
    "id_number" VARCHAR(255),
    "date_of_birth" VARCHAR(10),
    "gender" VARCHAR(10),
    "email" VARCHAR(255) NOT NULL,
    "phone_number" VARCHAR(20),
    "address" VARCHAR(255),
    "role" "user_role" NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "profilePicture" BYTEA,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "parent" ADD CONSTRAINT "parent_studentid_fkey" FOREIGN KEY ("studentid") REFERENCES "students"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "parent" ADD CONSTRAINT "parent_userid_fkey" FOREIGN KEY ("userid") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_classroomid_fkey" FOREIGN KEY ("classroomid") REFERENCES "classroom"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_userid_fkey" FOREIGN KEY ("userid") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "teacher" ADD CONSTRAINT "teacher_classroomid_fkey" FOREIGN KEY ("classroomid") REFERENCES "classroom"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "teacher" ADD CONSTRAINT "teacher_subjectid_fkey" FOREIGN KEY ("subjectid") REFERENCES "subject"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "teacher" ADD CONSTRAINT "teacher_userid_fkey" FOREIGN KEY ("userid") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "timetable" ADD CONSTRAINT "timetable_classroomid_fkey" FOREIGN KEY ("classroomid") REFERENCES "classroom"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "timetable" ADD CONSTRAINT "timetable_subjectid_fkey" FOREIGN KEY ("subjectid") REFERENCES "subject"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "timetable" ADD CONSTRAINT "timetable_teacherid_fkey" FOREIGN KEY ("teacherid") REFERENCES "teacher"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
