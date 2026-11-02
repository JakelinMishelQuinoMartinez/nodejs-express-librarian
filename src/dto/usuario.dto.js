export class UsuarioCrearDTO {
  constructor(data) {
    this.identificacion = data.identificacion;
    this.nombre = data.nombre;
    this.telefono = data.telefono || null;
    this.direccion = data.direccion || null;
    this.email = data.email;
    this.password = data.password;
    this.rol = data.rol === 'admin' ? 'admin' : 'usuario';
  }
}

export class UsuarioObtenerDTO {
  constructor(data) {
    this.id = data.id;
    this.identificacion = data.identificacion;
    this.nombre = data.nombre;
    this.telefono = data.telefono;
    this.direccion = data.direccion;
    this.email = data.email;
    this.rol = data.rol;
    this.activo = Boolean(data.activo);
    this.creadoEn = data.creado_en;
  }
}
