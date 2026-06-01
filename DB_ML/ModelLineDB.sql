Create DATABASE ModelLineDB;
Go

CREATE TABLE Usuarios (
	IdUsuario INT PRIMARY KEY IDENTITY(1,1),
	Nombre NVARCHAR (100) NOT NULL,
	Usuario NVARCHAR(100) NOT NULL UNIQUE,
	Contraseña NVARCHAR(10) NOT NULL,
	Rol NVARCHAR(20) NOT NULL,
	Activo BIT NOT NULL DEFAULT 1
);

CREATE TABLE BusinessUnit (
	IdBusinessUnit INT PRIMARY KEY IDENTITY(1,1),
	Nombre NVARCHAR (100) NOT NULL,
);

CREATE TABLE ProductionLine (
	IdProductionLine INT PRIMARY KEY IDENTITY(1,1),
	IdBusinessUnit INT NOT NULL,
	Nombre NVARCHAR(100) NOT NULL,
	FOREIGN KEY (IdBusinessUnit) REFERENCES BusinessUnit(IdBusinessUnit)
);

CREATE TABLE Modulos (
	IdModulo INT PRIMARY KEY IDENTITY(1,1),
	Nombre NVARCHAR(100) NOT NULL
);

CREATE TABLE Preguntas (
	IdPregunta INT PRIMARY KEY IDENTITY(1,1),
	IdModulo INT NOT NULL,
	Texto NVARCHAR(255) NOT NULL,
	FOREIGN KEY (IdModulo) REFERENCES Modulos(IdModulo)
);

CREATE TABLE Reviews (
	IdReview INT PRIMARY KEY IDENTITY(1,1),
	IdUsuario INT NOT NULL,
	IdBusinessUnit INT NOT NULL,
	IdProductionLine INT NOT NULL,
	FechaReview DATETIME NOT NULL DEFAULT GETDATE(),
	PorcentajeTotal Decimal(5,2) NULL,
	FOREIGN KEY (IdUsuario) REFERENCES Usuarios(IdUsuario),
	FOREIGN KEY (IdBusinessUnit) REFERENCES BusinessUnit(IdBusinessUnit),
	FOREIGN KEY (IdProductionLine) REFERENCES ProductionLine(IdProductionLine)
	);

CREATE TABLE Respuestas(
	IdResuesta INT PRIMARY KEY IDENTITY(1,1),
	IdReview INT NOT NULL,
	IdPregunta INT NOT NULL,
	Puntuacion INT NOT NULL,
	Comentario NVARCHAR(255) NOT NULL,

	FOREIGN KEY (IdReview) REFERENCES Reviews(IdReview),
	FOREIGN KEY (IdPregunta) REFERENCES Preguntas(IdPregunta)
	);
