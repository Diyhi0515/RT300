from app.core.credenciales_sesion import CredencialesSesion


def test_guarda_renueva_y_elimina_sin_persistencia():
    almacen = CredencialesSesion()
    sid = almacen.guardar("clave", 60)
    assert almacen.obtener(sid) == "clave"
    assert almacen.renovar(sid, 60)
    almacen.eliminar(sid)
    assert almacen.obtener(sid) is None


def test_una_sesion_inexistente_no_se_renueva():
    assert not CredencialesSesion().renovar("no-existe", 60)
