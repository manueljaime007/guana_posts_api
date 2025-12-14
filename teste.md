generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  ADMIN
}

// ===================== USERS =====================
model User {
  id            Int            @id @default(autoincrement())
  name          String         @db.VarChar(50)
  email         String         @unique @db.VarChar(100)
  password      String         @db.VarChar(255)
  role          Role           @default(USER)
  images        Image[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  deletedAt     DateTime?
  refreshTokens RefreshToken[]

  @@map("users")
}

// ===================== CATEGORIES =====================
model Category {
  id      Int      @id @default(autoincrement())
  name    String   @unique @db.VarChar(50)
  images  Image[]

  @@map("categories")
}

// ===================== TAGS =====================
model Tag {
  id      Int      @id @default(autoincrement())
  name    String   @unique @db.VarChar(50)
  images  Image[]  @relation("ImageTags", references: [id])

  @@map("tags")
}

// ===================== IMAGES =====================
model Image {
  id          Int       @id @default(autoincrement())
  userId      Int
  categoryId  Int
  fileName    String    @db.VarChar(255)
  filePath    String    @db.VarChar(500)
  mimeType    String    @db.VarChar(50)
  size        Int
  description String?   @db.Text
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  category    Category  @relation(fields: [categoryId], references: [id])
  tags        Tag[]     @relation("ImageTags", references: [id])
  createdAt   DateTime  @default(now())
  deletedAt   DateTime?

  @@index([userId])
  @@index([categoryId])
  @@index([createdAt])
  @@index([deletedAt])
  @@map("images")
}

// ===================== RELAÇÃO REFRESH TOKENS =====================
model RefreshToken {
  id        Int      @id @default(autoincrement())
  userId    Int
  tokenHash String   @db.VarChar(255)
  createdAt DateTime @default(now())
  expiresAt DateTime
  revoked   Boolean  @default(false)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("refresh_tokens")
}

// ===================== RELAÇÃO IMAGEM ↔ TAG (MANY-TO-MANY) =====================
model _ImageToTag {
  A Int
  B Int

  @@id([A, B])
  @@map("image_tags")
}


refatoramos o schema 
agora a imagem tem descrição, categoria principal e tags
onde vamos alterar?

me diz só, como de fosse tarefa para casa, masme dê muitas, muitas dicas

vou fazer sozinho e depois tu fazes a correção