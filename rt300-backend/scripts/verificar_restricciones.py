"""Verificación en vivo de las restricciones del sistema antiguo contra la BD de DOCKER (nunca la del club).

Ocupa una mesa libre del local 2, prueba cada regla y la deja libre. Deja folios anulados y avanza contadores (normal).

    docker compose exec -T -e PYTHONPATH=/app backend python scripts/verificar_restricciones.py
"""
from sqlalchemy import text

from app import create_app
from app.core.db import get_db
from app.extensions import limiter

app = create_app()
limiter.reset()
c = app.test_client()
CSRF = {"X-Requested-With": "rt300"}
resultados = []


def check(nombre, ok, detalle=""):
    resultados.append((nombre, ok, detalle))
    print(("OK   " if ok else "FALLA"), nombre, detalle)


def login(usuario="GP1"):
    r = c.post("/api/v1/auth/login", json={"usuario": usuario, "clave": "123456"})
    return {"Authorization": f"Bearer {r.get_json()['access_token']}"}


h = login()
limiter.reset()

with app.app_context():
    db = get_db()
    libre = db.execute(text(
        "SELECT TOP 1 LTRIM(RTRIM(m.rtmsamesa)), m.rtmsacaco FROM rtmsa m JOIN rtaco a ON a.rtacocaco = m.rtmsacaco "
        "WHERE a.rtacocloc = 2 AND m.rtmsastat = 1 AND m.rtmsamrcb = 0 AND m.rtmsaestm = 1 AND m.rtmsanfol = 0 "
        "ORDER BY m.rtmsamesa DESC")).fetchone()
    desh = db.execute(text("SELECT TOP 1 LTRIM(RTRIM(rtmsamesa)) FROM rtmsa WHERE rtmsastat = 2 AND rtmsamrcb = 0")).fetchone()
    elim = db.execute(text("SELECT TOP 1 LTRIM(RTRIM(rtmsamesa)) FROM rtmsa WHERE rtmsamrcb = 9")).fetchone()
mesa, area = libre[0], libre[1]
print("mesa de prueba:", mesa, "área", area, "| deshabilitada:", desh and desh[0], "| eliminada:", elim and elim[0])


def codigo(r):
    j = r.get_json(silent=True) or {}
    return r.status_code, (j.get("error") or {}).get("code")


# 1. cuentas > comensales al ocupar
r = c.post(f"/api/v1/salon/mesas/{mesa}/ocupar", headers=h, json={"caco": area, "ccom": 2, "ncta": 3})
check("ocupar: cuentas > comensales", codigo(r) == (422, "CUENTAS_MAYOR_COMENSALES"), str(codigo(r)))
r = c.post(f"/api/v1/salon/mesas/{mesa}/ocupar", headers=h, json={"caco": area, "ccom": 0, "ncta": 1})
check("ocupar: 0 comensales", r.status_code == 422, str(codigo(r)))
r = c.post(f"/api/v1/salon/mesas/{mesa}/ocupar", headers=h, json={"cven": 12010, "caco": area, "ccom": 2, "ncta": 1})
check("ocupar: un usuario sin caja no asigna otro mesero", codigo(r) == (403, "SIN_PERMISO_MESERO"), str(codigo(r)))
r = c.get("/api/v1/salon/mesas", headers=h)
check("la mesa sigue libre tras los rechazos", next(m for m in r.get_json()["mesas"] if m["mesa"].strip() == mesa)["folio"] in (0, None))

# mesas no operables
if desh:
    r = c.post(f"/api/v1/salon/mesas/{desh[0]}/ocupar", headers=h, json={"caco": 1, "ccom": 2, "ncta": 1})
    check("ocupar: mesa deshabilitada", r.status_code in (404, 409), str(codigo(r)) + " (original: 'esta deshabilitada')")
if elim:
    r = c.post(f"/api/v1/salon/mesas/{elim[0]}/ocupar", headers=h, json={"caco": 1, "ccom": 2, "ncta": 1})
    check("ocupar: mesa eliminada", r.status_code in (404, 409), str(codigo(r)) + " (original: 'fue eliminada')")

# 2. ocupar bien y de nuevo
r = c.post(f"/api/v1/salon/mesas/{mesa}/ocupar", headers=h, json={"caco": area, "ccom": 3, "ncta": 2})
check("ocupar correcto", r.status_code in (200, 201), str(codigo(r)))
folio = (r.get_json() or {}).get("folio")
r = c.post(f"/api/v1/salon/mesas/{mesa}/ocupar", headers=h, json={"caco": area, "ccom": 3, "ncta": 2})
check("ocupar una mesa ya ocupada", codigo(r) == (409, "MESA_OCUPADA"), str(codigo(r)))

# 3. modificar
r = c.patch(f"/api/v1/salon/folios/{folio}", headers=h, json={"ccom": 2, "ncta": 3})
check("modificar: cuentas > comensales", codigo(r) == (422, "CUENTAS_MAYOR_COMENSALES"), str(codigo(r)))
r = c.patch(f"/api/v1/salon/folios/{folio}", headers=h, json={"ccom": 3, "ncta": 3})
check("modificar: agregar una cuenta", r.status_code == 200, str(codigo(r)))
r = c.patch(f"/api/v1/salon/folios/{folio}", headers=h, json={"ccom": 3, "ncta": 1})
check("modificar: quitar cuentas sin comandas", r.status_code == 200, str(codigo(r)))

# 4. cuenta de datos
r = c.get(f"/api/v1/salon/folios/{folio}/detalle", headers=h)
check("detalle del folio", r.status_code == 200)
r = c.put(f"/api/v1/folios/{folio}/cuentas/1", headers=h, json={"mesa": mesa, "cage": 99999999, "nruc": "0", "nomb": "X"})
check("cuenta: cliente inexistente", r.status_code in (404, 409, 422), str(codigo(r)))
r = c.put(f"/api/v1/folios/{folio}/cuentas/9", headers=h, json={"mesa": mesa, "cage": 0, "nruc": "", "nomb": "X"})
check("cuenta: número inexistente", r.status_code == 404, str(codigo(r)))
r = c.put(f"/api/v1/folios/{folio}/cuentas/1", headers=h, json={"mesa": "OTRA", "cage": 0, "nruc": "", "nomb": "X"})
check("cuenta: mesa que no es del folio", r.status_code in (404, 409), str(codigo(r)))

# 5. comanda
base = f"/api/v1/folios/{folio}/cuentas/1/comandas"
r = c.post(base, headers=h, json={"glos": "", "items": []})
check("comanda: sin productos", r.status_code == 422, str(codigo(r)))
r = c.post(base, headers=h, json={"glos": "", "items": [{"cart": "5101004", "cant": 0}]})
check("comanda: cantidad 0", r.status_code == 422, str(codigo(r)))
r = c.post(f"/api/v1/folios/{folio}/cuentas/9/comandas", headers=h, json={"glos": "", "items": [{"cart": "5101004", "cant": 1}]})
check("comanda: cuenta inexistente", codigo(r)[1] == "CUENTA_NO_ABIERTA", str(codigo(r)))
r = c.post(base, headers=h, json={"glos": "", "items": [{"cart": "NOEXISTE", "cant": 1}]})
check("comanda: producto inexistente", r.status_code in (404, 422), str(codigo(r)))

# 6. imprimir cuenta inexistente
r = c.post(f"/api/v1/folios/{folio}/cuentas/9/imprimir", headers=h, json={"mesa": mesa, "cven": "12009", "caco": str(area)})
check("imprimir: cuenta no abierta", codigo(r)[1] == "CUENTA_NO_ABIERTA", str(codigo(r)))

# 7. eliminar / reimprimir comandas
cuerpo = {"nfol": folio, "mesa": mesa, "uaut": "GP1", "cont": "123456", "mtvo": 1, "items": [{"ncom": 1, "item": 1}]}
r = c.post("/api/v1/comandas/eliminar", headers=h, json=cuerpo)
check("eliminar: productos que no son del folio", codigo(r)[1] in ("ITEMS_NO_VIGENTES", "SIN_COMANDAS", "MOTIVO_INVALIDO"), str(codigo(r)))
r = c.post("/api/v1/comandas/eliminar", headers=h, json={**cuerpo, "cont": "mala"})
check("eliminar: clave de autorizador incorrecta", codigo(r)[1] == "AUTORIZADOR_INVALIDO", str(codigo(r)))

# 8. habilitar
r = c.post(f"/api/v1/salon/mesas/{mesa}/habilitar", headers=h)
check("habilitar mesa sin comandas", r.status_code == 200, str(codigo(r)))

# 9. acceso y sesión
r = c.get("/api/v1/auth/usuarios")
check("acceso rápido: 34 usuarios del original", len(r.get_json()["usuarios"]) == 34, str(len(r.get_json()["usuarios"])))
r = c.post("/api/v1/auth/login", json={"usuario": "GP1", "clave": "mala"})
check("login: clave errónea", codigo(r)[1] == "CREDENCIALES_INVALIDAS")
r = c.post("/api/v1/auth/login", json={"usuario": "NOEXISTE", "clave": "x"})
check("login: usuario inexistente (mismo mensaje)", codigo(r)[1] == "CREDENCIALES_INVALIDAS")
r = c.get("/api/v1/salon/mesas")
check("sin sesión no se ve nada", r.status_code == 401)

fallas = [x for x in resultados if not x[1]]
print(f"\n{len(resultados) - len(fallas)}/{len(resultados)} correctas")
for f in fallas:
    print("  FALLA:", f[0], f[2])
