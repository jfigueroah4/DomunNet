CREATE TABLE IF NOT EXISTS departamentos (
  id integer PRIMARY KEY,
  nombre text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS municipios (
  id integer PRIMARY KEY,
  departamento_id integer NOT NULL REFERENCES departamentos(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(departamento_id, slug)
);

INSERT INTO departamentos (id, nombre, slug) VALUES 
(1, 'Guatemala', 'guatemala'),
(2, 'El Progreso', 'el-progreso'),
(3, 'Sacatepéquez', 'sacatepequez'),
(4, 'Chimaltenango', 'chimaltenango'),
(5, 'Escuintla', 'escuintla'),
(6, 'Santa Rosa', 'santa-rosa'),
(7, 'Sololá', 'solola'),
(8, 'Totonicapán', 'totonicapan'),
(9, 'Quetzaltenango', 'quetzaltenango'),
(10, 'Suchitepéquez', 'suchitepequez'),
(11, 'Retalhuleu', 'retalhuleu'),
(12, 'San Marcos', 'san-marcos'),
(13, 'Huehuetenango', 'huehuetenango'),
(14, 'Quiché', 'quiche'),
(15, 'Baja Verapaz', 'baja-verapaz'),
(16, 'Alta Verapaz', 'alta-verapaz'),
(17, 'Petén', 'peten'),
(18, 'Izabal', 'izabal'),
(19, 'Zacapa', 'zacapa'),
(20, 'Chiquimula', 'chiquimula'),
(21, 'Jalapa', 'jalapa'),
(22, 'Jutiapa', 'jutiapa')
ON CONFLICT (id) DO NOTHING;

INSERT INTO municipios (id, departamento_id, nombre, slug) VALUES 
(101, 1, 'Guatemala', 'guatemala-ciudad'),
(102, 1, 'Mixco', 'mixco'),
(103, 1, 'Villa Nueva', 'villa-nueva'),
(104, 1, 'Santa Catarina Pinula', 'santa-catarina-pinula'),
(105, 1, 'San Miguel Petapa', 'san-miguel-petapa'),
(201, 2, 'Guastatoya', 'guastatoya'),
(202, 2, 'Sanarate', 'sanarate'),
(301, 3, 'Antigua Guatemala', 'antigua-guatemala'),
(302, 3, 'San Juan Sacatepéquez', 'san-juan-sacatepequez'),
(401, 4, 'Chimaltenango', 'chimaltenango-mun'),
(402, 4, 'El Tejar', 'el-tejar'),
(501, 5, 'Escuintla', 'escuintla-mun'),
(502, 5, 'Santa Lucía Cotzumalguapa', 'santa-lucia-cotzumalguapa'),
(503, 5, 'Puerto San José', 'puerto-san-jose'),
(901, 9, 'Quetzaltenango', 'xela'),
(902, 9, 'Salcajá', 'salcaja'),
(903, 9, 'Coatepeque', 'coatepeque'),
(1601, 16, 'Cobán', 'coban'),
(1602, 16, 'San Pedro Carchá', 'san-pedro-carcha'),
(1701, 17, 'Flores', 'flores'),
(1702, 17, 'San Benito', 'san-benito'),
(1703, 17, 'Santa Elena', 'santa-elena'),
(1801, 18, 'Puerto Barrios', 'puerto-barrios'),
(1802, 18, 'Morales', 'morales')
ON CONFLICT (id) DO NOTHING;
