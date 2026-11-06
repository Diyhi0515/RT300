from app.core.legacy_password import clave_calcular, verificar


def test_valores_conocidos_del_php():
    assert clave_calcular("A") == 39483        # 123 * 321
    assert clave_calcular("123456") == 314580  # clave de pruebas del sistema anterior


def test_verificar_con_espacios_char():
    assert verificar("123456", "314580      ")
    assert not verificar("123457", "314580")
