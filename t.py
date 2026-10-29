
import sys; sys.path.insert(0,'sandbox')
import nucleo
print('girias:',len(nucleo.GIRIAS))
frase="Oxe, esse kit ta arretado de bom, visse? Égua, olha a pavulagem desse mano no rolê, bah tchê que tri frio!"
print('FALA:',nucleo.preparar_fala(frase))
print('SOMA:',nucleo.preparar_fala("que gostosão, coraçãozinho, topzera"))
print('NAO TOCA:',nucleo.preparar_fala("oxente e arretadamente"))
