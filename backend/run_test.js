"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv_1 = require("dotenv");
(0, dotenv_1.config)({ path: 'C:/DomunNet/backend/.env' });
var proyectos_servicio_1 = require("./src/modules/proyectos/proyectos.servicio");
var cliente_supabase_1 = require("./src/configuracion/cliente-supabase");
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var payload, id, p, pd, pu, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    payload = {
                        nombreOficial: "Proyecto de Prueba E2E",
                        descripcion: "Prueba de insercion completa",
                        ubicacionFisica: "Tramo de prueba",
                        municipioId: null,
                        empresaContratanteId: "c19b7c0c-79db-4254-bd53-153d0246fd05",
                        empresaContratista: "c19b7c0c-79db-4254-bd53-153d0246fd05",
                        empresaSupervisora: "Supervisora SA",
                        fechaAdjudicacion: "2026-09-01",
                        fechaInicioContractual: "2026-09-10",
                        numeroEscrituraPublica: "123-2026",
                        montoContractualOriginal: 1000000,
                        plazoEjecucionOriginal: "120",
                        plazoEjecucionRealAmpliado: "150",
                        fechaFinalizacionReal: "2027-02-01",
                        responsable: "149ff0d5-5e97-4491-8547-c896778fda40",
                        delegadoResidenteId: "a700035f-b306-437e-9539-668333dfd3ec",
                        equipo: [
                            { id: "a700035f-b306-437e-9539-668333dfd3ec", rol: "Delegado Residente" },
                            { id: "1f471ba3-d9da-402b-8ec5-6669cfa9a291", rol: "Supervisor" }
                        ]
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, (0, proyectos_servicio_1.crearProyecto)(payload)];
                case 2:
                    id = _a.sent();
                    console.log("PROYECTO CREADO CON ID:", id);
                    return [4 /*yield*/, cliente_supabase_1.clienteSupabase.from('proyecto').select('*').eq('id', id).single()];
                case 3:
                    p = (_a.sent()).data;
                    return [4 /*yield*/, cliente_supabase_1.clienteSupabase.from('proyecto_detalle').select('*').eq('proyecto_id', id).single()];
                case 4:
                    pd = (_a.sent()).data;
                    return [4 /*yield*/, cliente_supabase_1.clienteSupabase.from('proyecto_usuario').select('*').eq('proyecto_id', id)];
                case 5:
                    pu = (_a.sent()).data;
                    console.log("--- RESULTADOS DB ---");
                    console.log("PROYECTO RESPONSABLE ID:", p.responsable_id);
                    console.log("PLAZO ORIGINAL:", pd.plazo_ejecucion_original);
                    console.log("PLAZO AMPLIADO:", pd.plazo_ejecucion_ampliado);
                    console.log("EMPRESA CONTRATISTA ID:", pd.empresa_contratista_id);
                    console.log("FECHA FINALIZACION:", pd.fecha_finalizacion_real);
                    console.log("EQUIPO (COUNT):", pu.length, pu.map(function (x) { return x.rol_proyecto; }));
                    return [3 /*break*/, 7];
                case 6:
                    err_1 = _a.sent();
                    console.error("ERROR:", err_1);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
run();
