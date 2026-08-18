/**
 * Datos comerciales de referencia, derivados de "Base de Datos Ventas y Pagos.xlsx"
 * según el contrato de migración `mapeo_excel` del spec.
 *
 * Van embebidos en vez de leerse del archivo para que el seed no dependa de que
 * los documentos estén en el repositorio.
 *
 * Se cargan tal cual vienen, con sus inconsistencias documentadas:
 * - INC-04: 2 filas quedan en estado PROSPECCION con etapa CIERRE. El spec deja
 *   abierto si el estado debe derivarse de la etapa, así que no se corrige acá.
 * - INC-05: 5 ventas cerradas no traen valor y entran con cantidad/monto nulos.
 * - INC-07: la hoja Metas trae el mismo líder en las 28 filas. Se ignora y el
 *   líder se resuelve desde `asignacion_gestor_lider`, como indica el spec.
 *
 * El correo del gestor y del líder se arma con el prefijo más el dominio
 * corporativo (INC-10).
 */

export const DOMINIO = "@wantnget.com.co";

/** Periodo único que traen los datos de referencia. */
export const PERIODO_REFERENCIA = "2026-08";

export type VentaReferencia = {
  numeroIdentificacion: string;
  nombreAsociado: string;
  fecha: string;
  productoCodigo: string;
  valor: number | null;
  oficinaCodigo: string;
  estado: "CERRADO" | "PROSPECCION";
  etapa: "CONTACTO" | "OFERTA" | "CIERRE";
  resultadoCierre: "VENTA" | "NO_VENTA" | null;
  gestor: string;
  lider: string;
};

export type MetaReferencia = {
  gestor: string;
  productoCodigo: string;
  periodo: string;
  meta: number;
};

export const VENTAS: VentaReferencia[] = [
  {
    "numeroIdentificacion": "1048519955",
    "nombreAsociado": "Tatiana Peláez Valencia",
    "fecha": "2026-08-14",
    "productoCodigo": "AFILIACION",
    "valor": 1,
    "oficinaCodigo": "NORTE",
    "estado": "CERRADO",
    "etapa": "CIERRE",
    "resultadoCierre": "VENTA",
    "gestor": "dgonzalez",
    "lider": "mmartinez"
  },
  {
    "numeroIdentificacion": "1013998747",
    "nombreAsociado": "Germán Darío Agudelo Alzate",
    "fecha": "2026-08-14",
    "productoCodigo": "AFILIACION",
    "valor": null,
    "oficinaCodigo": "NORTE",
    "estado": "PROSPECCION",
    "etapa": "CIERRE",
    "resultadoCierre": "NO_VENTA",
    "gestor": "dgonzalez",
    "lider": "mmartinez"
  },
  {
    "numeroIdentificacion": "1002140662",
    "nombreAsociado": "Ana María Zapata Torres",
    "fecha": "2026-08-14",
    "productoCodigo": "COLOCACION",
    "valor": 10000000,
    "oficinaCodigo": "NORTE",
    "estado": "CERRADO",
    "etapa": "CIERRE",
    "resultadoCierre": "VENTA",
    "gestor": "dgonzalez",
    "lider": "mmartinez"
  },
  {
    "numeroIdentificacion": "1028875428",
    "nombreAsociado": "Ricardo Alzate Rincón",
    "fecha": "2026-08-14",
    "productoCodigo": "COLOCACION",
    "valor": 5000000,
    "oficinaCodigo": "NORTE",
    "estado": "PROSPECCION",
    "etapa": "OFERTA",
    "resultadoCierre": null,
    "gestor": "dgonzalez",
    "lider": "mmartinez"
  },
  {
    "numeroIdentificacion": "1093281904",
    "nombreAsociado": "Mónica Liliana Naranjo Duque",
    "fecha": "2026-08-14",
    "productoCodigo": "CDAT",
    "valor": 1000000,
    "oficinaCodigo": "NORTE",
    "estado": "CERRADO",
    "etapa": "CIERRE",
    "resultadoCierre": "VENTA",
    "gestor": "dgonzalez",
    "lider": "mmartinez"
  },
  {
    "numeroIdentificacion": "67689909",
    "nombreAsociado": "Juliana Escobar Torres",
    "fecha": "2026-08-14",
    "productoCodigo": "CDAT",
    "valor": 200000,
    "oficinaCodigo": "NORTE",
    "estado": "PROSPECCION",
    "etapa": "OFERTA",
    "resultadoCierre": null,
    "gestor": "dgonzalez",
    "lider": "mmartinez"
  },
  {
    "numeroIdentificacion": "22877244",
    "nombreAsociado": "Héctor Mauricio López Martínez",
    "fecha": "2026-08-14",
    "productoCodigo": "CUENTA_AHORRO",
    "valor": 1,
    "oficinaCodigo": "NORTE",
    "estado": "CERRADO",
    "etapa": "CIERRE",
    "resultadoCierre": "VENTA",
    "gestor": "dgonzalez",
    "lider": "mmartinez"
  },
  {
    "numeroIdentificacion": "53003691",
    "nombreAsociado": "Juan Carlos Marín Ríos",
    "fecha": "2026-08-14",
    "productoCodigo": "CUENTA_AHORRO",
    "valor": null,
    "oficinaCodigo": "NORTE",
    "estado": "PROSPECCION",
    "etapa": "CIERRE",
    "resultadoCierre": "NO_VENTA",
    "gestor": "dgonzalez",
    "lider": "mmartinez"
  },
  {
    "numeroIdentificacion": "1062531326",
    "nombreAsociado": "María Fernanda González Escobar",
    "fecha": "2026-08-14",
    "productoCodigo": "AHORRO_PROGRAMADO",
    "valor": 1,
    "oficinaCodigo": "NORTE",
    "estado": "CERRADO",
    "etapa": "CIERRE",
    "resultadoCierre": "VENTA",
    "gestor": "dgonzalez",
    "lider": "mmartinez"
  },
  {
    "numeroIdentificacion": "63490521",
    "nombreAsociado": "Luis Fernando Ortiz Alzate",
    "fecha": "2026-08-14",
    "productoCodigo": "AHORRO_PROGRAMADO",
    "valor": null,
    "oficinaCodigo": "NORTE",
    "estado": "PROSPECCION",
    "etapa": "CONTACTO",
    "resultadoCierre": null,
    "gestor": "dgonzalez",
    "lider": "mmartinez"
  },
  {
    "numeroIdentificacion": "1066168894",
    "nombreAsociado": "Gloria Inés Cañas Loaiza",
    "fecha": "2026-08-14",
    "productoCodigo": "SEGUROS",
    "valor": 1,
    "oficinaCodigo": "NORTE",
    "estado": "CERRADO",
    "etapa": "CIERRE",
    "resultadoCierre": "VENTA",
    "gestor": "dgonzalez",
    "lider": "mmartinez"
  },
  {
    "numeroIdentificacion": "1086865616",
    "nombreAsociado": "Diana Carolina Marín Salazar",
    "fecha": "2026-08-14",
    "productoCodigo": "SEGUROS",
    "valor": null,
    "oficinaCodigo": "NORTE",
    "estado": "PROSPECCION",
    "etapa": "CONTACTO",
    "resultadoCierre": null,
    "gestor": "dgonzalez",
    "lider": "mmartinez"
  },
  {
    "numeroIdentificacion": "1048263051",
    "nombreAsociado": "Paula Andrea Delgado Jaramillo",
    "fecha": "2026-08-14",
    "productoCodigo": "SERVICIOS",
    "valor": 1,
    "oficinaCodigo": "NORTE",
    "estado": "CERRADO",
    "etapa": "CIERRE",
    "resultadoCierre": "VENTA",
    "gestor": "dgonzalez",
    "lider": "mmartinez"
  },
  {
    "numeroIdentificacion": "1010037379",
    "nombreAsociado": "Nubia Esperanza Restrepo Correa",
    "fecha": "2026-08-14",
    "productoCodigo": "SERVICIOS",
    "valor": null,
    "oficinaCodigo": "NORTE",
    "estado": "PROSPECCION",
    "etapa": "CONTACTO",
    "resultadoCierre": null,
    "gestor": "dgonzalez",
    "lider": "mmartinez"
  },
  {
    "numeroIdentificacion": "1006018885",
    "nombreAsociado": "Paula Andrea Jaramillo Quintero",
    "fecha": "2026-08-14",
    "productoCodigo": "AFILIACION",
    "valor": 2,
    "oficinaCodigo": "NORTE",
    "estado": "CERRADO",
    "etapa": "CIERRE",
    "resultadoCierre": "VENTA",
    "gestor": "pjimenez",
    "lider": "mmartinez"
  },
  {
    "numeroIdentificacion": "1081140037",
    "nombreAsociado": "Mateo Quintero Bedoya",
    "fecha": "2026-08-14",
    "productoCodigo": "AFILIACION",
    "valor": 1,
    "oficinaCodigo": "NORTE",
    "estado": "PROSPECCION",
    "etapa": "OFERTA",
    "resultadoCierre": null,
    "gestor": "pjimenez",
    "lider": "mmartinez"
  },
  {
    "numeroIdentificacion": "1099200108",
    "nombreAsociado": "Jhon Alexánder Ramos Molina",
    "fecha": "2026-08-14",
    "productoCodigo": "COLOCACION",
    "valor": 6000000,
    "oficinaCodigo": "NORTE",
    "estado": "PROSPECCION",
    "etapa": "OFERTA",
    "resultadoCierre": null,
    "gestor": "pjimenez",
    "lider": "mmartinez"
  },
  {
    "numeroIdentificacion": "1061288195",
    "nombreAsociado": "María Fernanda Cortés Torres",
    "fecha": "2026-08-14",
    "productoCodigo": "COLOCACION",
    "valor": null,
    "oficinaCodigo": "NORTE",
    "estado": "CERRADO",
    "etapa": "CIERRE",
    "resultadoCierre": "VENTA",
    "gestor": "pjimenez",
    "lider": "mmartinez"
  },
  {
    "numeroIdentificacion": "46301665",
    "nombreAsociado": "Álvaro José Torres Rodríguez",
    "fecha": "2026-08-14",
    "productoCodigo": "CDAT",
    "valor": 3000000,
    "oficinaCodigo": "NORTE",
    "estado": "PROSPECCION",
    "etapa": "OFERTA",
    "resultadoCierre": null,
    "gestor": "pjimenez",
    "lider": "mmartinez"
  },
  {
    "numeroIdentificacion": "74123566",
    "nombreAsociado": "Leidy Johana Zapata Torres",
    "fecha": "2026-08-14",
    "productoCodigo": "CDAT",
    "valor": null,
    "oficinaCodigo": "NORTE",
    "estado": "CERRADO",
    "etapa": "CIERRE",
    "resultadoCierre": "VENTA",
    "gestor": "pjimenez",
    "lider": "mmartinez"
  },
  {
    "numeroIdentificacion": "1071951881",
    "nombreAsociado": "Sandra Milena González Ramírez",
    "fecha": "2026-08-14",
    "productoCodigo": "CUENTA_AHORRO",
    "valor": 3,
    "oficinaCodigo": "NORTE",
    "estado": "PROSPECCION",
    "etapa": "OFERTA",
    "resultadoCierre": null,
    "gestor": "pjimenez",
    "lider": "mmartinez"
  },
  {
    "numeroIdentificacion": "40680765",
    "nombreAsociado": "Mónica Liliana Ospina Torres",
    "fecha": "2026-08-14",
    "productoCodigo": "CUENTA_AHORRO",
    "valor": 2,
    "oficinaCodigo": "NORTE",
    "estado": "CERRADO",
    "etapa": "CIERRE",
    "resultadoCierre": "VENTA",
    "gestor": "pjimenez",
    "lider": "mmartinez"
  },
  {
    "numeroIdentificacion": "1083214985",
    "nombreAsociado": "Sandra Milena Valencia Zapata",
    "fecha": "2026-08-14",
    "productoCodigo": "AHORRO_PROGRAMADO",
    "valor": 2,
    "oficinaCodigo": "NORTE",
    "estado": "PROSPECCION",
    "etapa": "OFERTA",
    "resultadoCierre": null,
    "gestor": "pjimenez",
    "lider": "mmartinez"
  },
  {
    "numeroIdentificacion": "1099096115",
    "nombreAsociado": "Mauricio Marín Cardona",
    "fecha": "2026-08-14",
    "productoCodigo": "AHORRO_PROGRAMADO",
    "valor": 1,
    "oficinaCodigo": "NORTE",
    "estado": "CERRADO",
    "etapa": "CIERRE",
    "resultadoCierre": "VENTA",
    "gestor": "pjimenez",
    "lider": "mmartinez"
  },
  {
    "numeroIdentificacion": "41771405",
    "nombreAsociado": "Wílmar Loaiza Arias",
    "fecha": "2026-08-14",
    "productoCodigo": "SEGUROS",
    "valor": 4,
    "oficinaCodigo": "NORTE",
    "estado": "PROSPECCION",
    "etapa": "OFERTA",
    "resultadoCierre": null,
    "gestor": "pjimenez",
    "lider": "mmartinez"
  },
  {
    "numeroIdentificacion": "77854417",
    "nombreAsociado": "Julián David Jaramillo Orozco",
    "fecha": "2026-08-14",
    "productoCodigo": "SEGUROS",
    "valor": 2,
    "oficinaCodigo": "NORTE",
    "estado": "CERRADO",
    "etapa": "CIERRE",
    "resultadoCierre": "VENTA",
    "gestor": "pjimenez",
    "lider": "mmartinez"
  },
  {
    "numeroIdentificacion": "1042004773",
    "nombreAsociado": "Daniel Esteban Alzate Vargas",
    "fecha": "2026-08-14",
    "productoCodigo": "SERVICIOS",
    "valor": 1,
    "oficinaCodigo": "NORTE",
    "estado": "PROSPECCION",
    "etapa": "OFERTA",
    "resultadoCierre": null,
    "gestor": "pjimenez",
    "lider": "mmartinez"
  },
  {
    "numeroIdentificacion": "1078694427",
    "nombreAsociado": "Germán Darío Sánchez Mejía",
    "fecha": "2026-08-14",
    "productoCodigo": "SERVICIOS",
    "valor": null,
    "oficinaCodigo": "NORTE",
    "estado": "CERRADO",
    "etapa": "CIERRE",
    "resultadoCierre": "VENTA",
    "gestor": "pjimenez",
    "lider": "mmartinez"
  },
  {
    "numeroIdentificacion": "1076760882",
    "nombreAsociado": "Juliana Rincón Franco",
    "fecha": "2026-08-14",
    "productoCodigo": "AFILIACION",
    "valor": 3,
    "oficinaCodigo": "SUR",
    "estado": "CERRADO",
    "etapa": "CIERRE",
    "resultadoCierre": "VENTA",
    "gestor": "sramirez",
    "lider": "ccaceres"
  },
  {
    "numeroIdentificacion": "31640428",
    "nombreAsociado": "Fabián Andrés Ríos Gómez",
    "fecha": "2026-08-14",
    "productoCodigo": "AFILIACION",
    "valor": 1,
    "oficinaCodigo": "SUR",
    "estado": "PROSPECCION",
    "etapa": "OFERTA",
    "resultadoCierre": null,
    "gestor": "sramirez",
    "lider": "ccaceres"
  },
  {
    "numeroIdentificacion": "1047507751",
    "nombreAsociado": "Tatiana Agudelo Ortiz",
    "fecha": "2026-08-14",
    "productoCodigo": "COLOCACION",
    "valor": 9000000,
    "oficinaCodigo": "SUR",
    "estado": "PROSPECCION",
    "etapa": "OFERTA",
    "resultadoCierre": null,
    "gestor": "sramirez",
    "lider": "ccaceres"
  },
  {
    "numeroIdentificacion": "73190032",
    "nombreAsociado": "Luz Adriana Giraldo Ospina",
    "fecha": "2026-08-14",
    "productoCodigo": "COLOCACION",
    "valor": 2000000,
    "oficinaCodigo": "SUR",
    "estado": "CERRADO",
    "etapa": "CIERRE",
    "resultadoCierre": "VENTA",
    "gestor": "sramirez",
    "lider": "ccaceres"
  },
  {
    "numeroIdentificacion": "57093434",
    "nombreAsociado": "Laura Valentina González Ramírez",
    "fecha": "2026-08-14",
    "productoCodigo": "CDAT",
    "valor": 1500000,
    "oficinaCodigo": "SUR",
    "estado": "PROSPECCION",
    "etapa": "OFERTA",
    "resultadoCierre": null,
    "gestor": "sramirez",
    "lider": "ccaceres"
  },
  {
    "numeroIdentificacion": "1066616876",
    "nombreAsociado": "Édwin Loaiza Muñoz",
    "fecha": "2026-08-14",
    "productoCodigo": "CDAT",
    "valor": 500000,
    "oficinaCodigo": "SUR",
    "estado": "CERRADO",
    "etapa": "CIERRE",
    "resultadoCierre": "VENTA",
    "gestor": "sramirez",
    "lider": "ccaceres"
  },
  {
    "numeroIdentificacion": "1043111298",
    "nombreAsociado": "Yuly Andrea Torres Ceballos",
    "fecha": "2026-08-14",
    "productoCodigo": "CUENTA_AHORRO",
    "valor": 2,
    "oficinaCodigo": "SUR",
    "estado": "PROSPECCION",
    "etapa": "OFERTA",
    "resultadoCierre": null,
    "gestor": "sramirez",
    "lider": "ccaceres"
  },
  {
    "numeroIdentificacion": "28301892",
    "nombreAsociado": "Natalia Torres Rincón",
    "fecha": "2026-08-14",
    "productoCodigo": "CUENTA_AHORRO",
    "valor": 3,
    "oficinaCodigo": "SUR",
    "estado": "CERRADO",
    "etapa": "CIERRE",
    "resultadoCierre": "VENTA",
    "gestor": "sramirez",
    "lider": "ccaceres"
  },
  {
    "numeroIdentificacion": "53333286",
    "nombreAsociado": "Yolanda Delgado Arias",
    "fecha": "2026-08-14",
    "productoCodigo": "AHORRO_PROGRAMADO",
    "valor": 4,
    "oficinaCodigo": "SUR",
    "estado": "PROSPECCION",
    "etapa": "OFERTA",
    "resultadoCierre": null,
    "gestor": "sramirez",
    "lider": "ccaceres"
  },
  {
    "numeroIdentificacion": "1000067641",
    "nombreAsociado": "Javier Antonio Ceballos Herrera",
    "fecha": "2026-08-14",
    "productoCodigo": "AHORRO_PROGRAMADO",
    "valor": 1,
    "oficinaCodigo": "SUR",
    "estado": "CERRADO",
    "etapa": "CIERRE",
    "resultadoCierre": "VENTA",
    "gestor": "sramirez",
    "lider": "ccaceres"
  },
  {
    "numeroIdentificacion": "40675250",
    "nombreAsociado": "Fabián Andrés Zapata Castrillón",
    "fecha": "2026-08-14",
    "productoCodigo": "SEGUROS",
    "valor": 2,
    "oficinaCodigo": "SUR",
    "estado": "PROSPECCION",
    "etapa": "OFERTA",
    "resultadoCierre": null,
    "gestor": "sramirez",
    "lider": "ccaceres"
  },
  {
    "numeroIdentificacion": "1097475247",
    "nombreAsociado": "Luis Fernando Serna Jaramillo",
    "fecha": "2026-08-14",
    "productoCodigo": "SEGUROS",
    "valor": null,
    "oficinaCodigo": "SUR",
    "estado": "CERRADO",
    "etapa": "CIERRE",
    "resultadoCierre": "VENTA",
    "gestor": "sramirez",
    "lider": "ccaceres"
  },
  {
    "numeroIdentificacion": "1041078693",
    "nombreAsociado": "Natalia Quintero Ramírez",
    "fecha": "2026-08-14",
    "productoCodigo": "SERVICIOS",
    "valor": 1,
    "oficinaCodigo": "SUR",
    "estado": "PROSPECCION",
    "etapa": "OFERTA",
    "resultadoCierre": null,
    "gestor": "sramirez",
    "lider": "ccaceres"
  },
  {
    "numeroIdentificacion": "1075906719",
    "nombreAsociado": "Diego Alejandro Betancur Franco",
    "fecha": "2026-08-14",
    "productoCodigo": "SERVICIOS",
    "valor": null,
    "oficinaCodigo": "SUR",
    "estado": "CERRADO",
    "etapa": "CIERRE",
    "resultadoCierre": "VENTA",
    "gestor": "sramirez",
    "lider": "ccaceres"
  },
  {
    "numeroIdentificacion": "35184190",
    "nombreAsociado": "Gloria Inés Cañas Velásquez",
    "fecha": "2026-08-14",
    "productoCodigo": "AFILIACION",
    "valor": 1,
    "oficinaCodigo": "SUR",
    "estado": "CERRADO",
    "etapa": "CIERRE",
    "resultadoCierre": "VENTA",
    "gestor": "prubio",
    "lider": "ccaceres"
  },
  {
    "numeroIdentificacion": "1005398036",
    "nombreAsociado": "María Fernanda Arias Ospina",
    "fecha": "2026-08-14",
    "productoCodigo": "AFILIACION",
    "valor": 1,
    "oficinaCodigo": "SUR",
    "estado": "PROSPECCION",
    "etapa": "OFERTA",
    "resultadoCierre": null,
    "gestor": "prubio",
    "lider": "ccaceres"
  },
  {
    "numeroIdentificacion": "64910290",
    "nombreAsociado": "Wílmar Ríos Delgado",
    "fecha": "2026-08-14",
    "productoCodigo": "COLOCACION",
    "valor": 1000000,
    "oficinaCodigo": "SUR",
    "estado": "PROSPECCION",
    "etapa": "OFERTA",
    "resultadoCierre": null,
    "gestor": "prubio",
    "lider": "ccaceres"
  },
  {
    "numeroIdentificacion": "1063686131",
    "nombreAsociado": "Tatiana Grajales Peláez",
    "fecha": "2026-08-14",
    "productoCodigo": "COLOCACION",
    "valor": 5000000,
    "oficinaCodigo": "SUR",
    "estado": "CERRADO",
    "etapa": "CIERRE",
    "resultadoCierre": "VENTA",
    "gestor": "prubio",
    "lider": "ccaceres"
  },
  {
    "numeroIdentificacion": "1014247001",
    "nombreAsociado": "Claudia Patricia Gómez Escobar",
    "fecha": "2026-08-14",
    "productoCodigo": "CDAT",
    "valor": 200000,
    "oficinaCodigo": "SUR",
    "estado": "PROSPECCION",
    "etapa": "OFERTA",
    "resultadoCierre": null,
    "gestor": "prubio",
    "lider": "ccaceres"
  },
  {
    "numeroIdentificacion": "1064785226",
    "nombreAsociado": "Jorge Enrique Loaiza López",
    "fecha": "2026-08-14",
    "productoCodigo": "CDAT",
    "valor": 2000000,
    "oficinaCodigo": "SUR",
    "estado": "CERRADO",
    "etapa": "CIERRE",
    "resultadoCierre": "VENTA",
    "gestor": "prubio",
    "lider": "ccaceres"
  },
  {
    "numeroIdentificacion": "1036823754",
    "nombreAsociado": "Óscar Iván Suárez Giraldo",
    "fecha": "2026-08-14",
    "productoCodigo": "CUENTA_AHORRO",
    "valor": 3,
    "oficinaCodigo": "SUR",
    "estado": "PROSPECCION",
    "etapa": "OFERTA",
    "resultadoCierre": null,
    "gestor": "prubio",
    "lider": "ccaceres"
  },
  {
    "numeroIdentificacion": "1042650996",
    "nombreAsociado": "Yolanda Orozco Ospina",
    "fecha": "2026-08-14",
    "productoCodigo": "CUENTA_AHORRO",
    "valor": 2,
    "oficinaCodigo": "SUR",
    "estado": "CERRADO",
    "etapa": "CIERRE",
    "resultadoCierre": "VENTA",
    "gestor": "prubio",
    "lider": "ccaceres"
  },
  {
    "numeroIdentificacion": "1038630870",
    "nombreAsociado": "Sandra Milena Jaramillo Valencia",
    "fecha": "2026-08-14",
    "productoCodigo": "AHORRO_PROGRAMADO",
    "valor": 2,
    "oficinaCodigo": "SUR",
    "estado": "PROSPECCION",
    "etapa": "OFERTA",
    "resultadoCierre": null,
    "gestor": "prubio",
    "lider": "ccaceres"
  },
  {
    "numeroIdentificacion": "1053555426",
    "nombreAsociado": "Martha Lucía Cortés Buitrago",
    "fecha": "2026-08-14",
    "productoCodigo": "AHORRO_PROGRAMADO",
    "valor": 1,
    "oficinaCodigo": "SUR",
    "estado": "CERRADO",
    "etapa": "CIERRE",
    "resultadoCierre": "VENTA",
    "gestor": "prubio",
    "lider": "ccaceres"
  },
  {
    "numeroIdentificacion": "12436499",
    "nombreAsociado": "Wílmar Sánchez Castrillón",
    "fecha": "2026-08-14",
    "productoCodigo": "SEGUROS",
    "valor": 4,
    "oficinaCodigo": "SUR",
    "estado": "PROSPECCION",
    "etapa": "OFERTA",
    "resultadoCierre": null,
    "gestor": "prubio",
    "lider": "ccaceres"
  },
  {
    "numeroIdentificacion": "1091072701",
    "nombreAsociado": "Valeria Duque Vargas",
    "fecha": "2026-08-14",
    "productoCodigo": "SEGUROS",
    "valor": 2,
    "oficinaCodigo": "SUR",
    "estado": "CERRADO",
    "etapa": "CIERRE",
    "resultadoCierre": "VENTA",
    "gestor": "prubio",
    "lider": "ccaceres"
  },
  {
    "numeroIdentificacion": "45502187",
    "nombreAsociado": "Jhon Alexánder Sánchez Escobar",
    "fecha": "2026-08-14",
    "productoCodigo": "SERVICIOS",
    "valor": 1,
    "oficinaCodigo": "SUR",
    "estado": "PROSPECCION",
    "etapa": "OFERTA",
    "resultadoCierre": null,
    "gestor": "prubio",
    "lider": "ccaceres"
  },
  {
    "numeroIdentificacion": "1081528071",
    "nombreAsociado": "Ángela María Arias Valencia",
    "fecha": "2026-08-14",
    "productoCodigo": "SERVICIOS",
    "valor": 6,
    "oficinaCodigo": "SUR",
    "estado": "CERRADO",
    "etapa": "CIERRE",
    "resultadoCierre": "VENTA",
    "gestor": "prubio",
    "lider": "ccaceres"
  }
];

export const METAS: MetaReferencia[] = [
  {
    "gestor": "prubio",
    "productoCodigo": "AFILIACION",
    "periodo": "2026-08",
    "meta": 4
  },
  {
    "gestor": "prubio",
    "productoCodigo": "AHORRO_PROGRAMADO",
    "periodo": "2026-08",
    "meta": 3
  },
  {
    "gestor": "prubio",
    "productoCodigo": "CDAT",
    "periodo": "2026-08",
    "meta": 5000000
  },
  {
    "gestor": "prubio",
    "productoCodigo": "COLOCACION",
    "periodo": "2026-08",
    "meta": 20000000
  },
  {
    "gestor": "prubio",
    "productoCodigo": "CUENTA_AHORRO",
    "periodo": "2026-08",
    "meta": 5
  },
  {
    "gestor": "prubio",
    "productoCodigo": "SEGUROS",
    "periodo": "2026-08",
    "meta": 2
  },
  {
    "gestor": "prubio",
    "productoCodigo": "SERVICIOS",
    "periodo": "2026-08",
    "meta": 5
  },
  {
    "gestor": "sramirez",
    "productoCodigo": "AFILIACION",
    "periodo": "2026-08",
    "meta": 4
  },
  {
    "gestor": "sramirez",
    "productoCodigo": "AHORRO_PROGRAMADO",
    "periodo": "2026-08",
    "meta": 3
  },
  {
    "gestor": "sramirez",
    "productoCodigo": "CDAT",
    "periodo": "2026-08",
    "meta": 5000000
  },
  {
    "gestor": "sramirez",
    "productoCodigo": "COLOCACION",
    "periodo": "2026-08",
    "meta": 20000000
  },
  {
    "gestor": "sramirez",
    "productoCodigo": "CUENTA_AHORRO",
    "periodo": "2026-08",
    "meta": 5
  },
  {
    "gestor": "sramirez",
    "productoCodigo": "SEGUROS",
    "periodo": "2026-08",
    "meta": 2
  },
  {
    "gestor": "sramirez",
    "productoCodigo": "SERVICIOS",
    "periodo": "2026-08",
    "meta": 5
  },
  {
    "gestor": "dgonzalez",
    "productoCodigo": "AFILIACION",
    "periodo": "2026-08",
    "meta": 3
  },
  {
    "gestor": "dgonzalez",
    "productoCodigo": "AHORRO_PROGRAMADO",
    "periodo": "2026-08",
    "meta": 2
  },
  {
    "gestor": "dgonzalez",
    "productoCodigo": "CDAT",
    "periodo": "2026-08",
    "meta": 4000000
  },
  {
    "gestor": "dgonzalez",
    "productoCodigo": "COLOCACION",
    "periodo": "2026-08",
    "meta": 17000000
  },
  {
    "gestor": "dgonzalez",
    "productoCodigo": "CUENTA_AHORRO",
    "periodo": "2026-08",
    "meta": 3
  },
  {
    "gestor": "dgonzalez",
    "productoCodigo": "SEGUROS",
    "periodo": "2026-08",
    "meta": 3
  },
  {
    "gestor": "dgonzalez",
    "productoCodigo": "SERVICIOS",
    "periodo": "2026-08",
    "meta": 2
  },
  {
    "gestor": "pjimenez",
    "productoCodigo": "AFILIACION",
    "periodo": "2026-08",
    "meta": 3
  },
  {
    "gestor": "pjimenez",
    "productoCodigo": "AHORRO_PROGRAMADO",
    "periodo": "2026-08",
    "meta": 3
  },
  {
    "gestor": "pjimenez",
    "productoCodigo": "CDAT",
    "periodo": "2026-08",
    "meta": 6000000
  },
  {
    "gestor": "pjimenez",
    "productoCodigo": "COLOCACION",
    "periodo": "2026-08",
    "meta": 22000000
  },
  {
    "gestor": "pjimenez",
    "productoCodigo": "CUENTA_AHORRO",
    "periodo": "2026-08",
    "meta": 2
  },
  {
    "gestor": "pjimenez",
    "productoCodigo": "SEGUROS",
    "periodo": "2026-08",
    "meta": 1
  },
  {
    "gestor": "pjimenez",
    "productoCodigo": "SERVICIOS",
    "periodo": "2026-08",
    "meta": 3
  }
];
