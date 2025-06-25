import React from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

export function Terms() {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={() => navigate(-1)}
    >
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl p-6"
        style={{ 
          background: currentTheme.colors.surface,
          color: currentTheme.colors.text,
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={() => navigate(-1)}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-black/5 transition-colors"
          style={{ color: currentTheme.colors.textSecondary }}
        >
          <X className="h-6 w-6" />
        </button>

        <h1 
          className="text-2xl font-bold mb-6"
          style={{ color: currentTheme.colors.text }}
        >
          Términos y Condiciones
        </h1>

        <div className="prose max-w-none space-y-6">
          <section>
            <p>
              El presente contrato describe los términos y condiciones generales (en adelante, los "TÉRMINOS Y CONDICIONES") aplicables al uso de los contenidos, productos y servicios ofrecidos a través del sitio www.doctorSoft (en adelante, el "SITIO WEB"), del cual es titular DoctorSoft, con domicilio en Calle de la Pradera 307 Despacho 109 segundo piso. Cualquier persona que acceda o utilice el SITIO WEB y los servicios ofrecidos, acepta sujetarse a estos TÉRMINOS Y CONDICIONES, así como a las políticas y principios aquí incorporados. Quien no acepte estos términos y condiciones deberá abstenerse de utilizar el SITIO WEB y/o adquirir los productos o servicios ofrecidos.
            </p>
            <h2 className="text-xl font-semibold mb-4">I. DEL OBJETO</h2>
            <p>
              Estos TÉRMINOS Y CONDICIONES regulan el acceso y uso del SITIO WEB, incluyendo todo contenido, producto o servicio disponible en el dominio www.doctorSoft.com.  DoctorSoft se reserva el derecho de modificar en cualquier momento y sin previo aviso la presentación, contenidos, funcionalidades, productos, servicios y configuración del SITIO WEB, pudiendo interrumpir, desactivar o cancelar cualquier elemento o el acceso a los mismos. El SITIO WEB está dirigido a personas mayores de edad. DoctorSoft no se hace responsable por el incumplimiento de este requisito. DoctorSoft podrá administrar o gestionar el SITIO WEB directamente o a través de terceros, sin que esto modifique estos TÉRMINOS Y CONDICIONES.
            </p>         
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-4">II. DEL USUARIO</h2>
            <p>
              El acceso o uso del SITIO WEB otorga la condición de USUARIO, quien queda sujeto a estos TÉRMINOS Y CONDICIONES y sus futuras modificaciones, así como a la legislación aplicable. Se considerarán aceptados desde el primer acceso al SITIO WEB. Se recomienda al USUARIO revisar periódicamente las actualizaciones de estos TÉRMINOS Y CONDICIONES. 
            </p>
            <p>
              El USUARIO se compromete a utilizar el SITIO WEB conforme a su diseño, prohibiéndose el uso de software para automatizar la interacción o descarga de contenidos o servicios. Asimismo, el USUARIO utilizará la información, contenidos o servicios de forma lícita, sin contravenir estos TÉRMINOS Y CONDICIONES, la moral o el orden público, y se abstendrá de cualquier acto que afecte derechos de terceros o el funcionamiento del SITIO WEB. DoctorSoft no será responsable por daños o perjuicios a terceros causados por culpa, mala práctica o negligencia del USUARIO, incluyendo la violación de normativas locales sobre protocolos o formatos de historias clínicas. El simple acceso al SITIO WEB no establece relación alguna entre DoctorSoft y el USUARIO.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-4">III. REGISTRO DE CUENTA</h2>
            <p>
             Para utilizar el Servicio, el USUARIO debe registrarse proporcionando información completa y veraz. La falta de registro impedirá el acceso al Servicio. El USUARIO es responsable de la confidencialidad y seguridad de sus datos de acceso, incluyendo contraseñas seguras. Al registrarse, el USUARIO acepta la responsabilidad total de las actividades realizadas bajo su nombre de usuario y contraseña. El USUARIO deberá notificar inmediatamente a DoctorSoft cualquier sospecha de violación, divulgación indebida o robo de su información personal. Se prohíbe utilizar el SITIO WEB o sus servicios de forma contraria a estos TÉRMINOS Y CONDICIONES y la legislación aplicable. El USUARIO es responsable de toda actividad realizada con su nombre de usuario y contraseña, así como de su custodia y uso adecuado del SITIO WEB para los fines previstos. Cualquier uso indebido se presumirá realizado por el USUARIO.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">IV. DEL ACCESO Y NAVEGACIÓN EN EL SITIO WEB</h2>
            <p>
              DoctorSoft no garantiza la continuidad ni disponibilidad de los contenidos, productos o servicios del SITIO WEB, aunque realizará esfuerzos razonables para su correcto funcionamiento, sin asumir responsabilidad alguna. DoctorSoft tampoco garantiza que el contenido o software accesible a través del SITIO WEB esté libre de errores o software malicioso que pueda dañar el equipo del USUARIO. DoctorSoft se deslinda de cualquier daño a terceros por errores en datos ingresados por el USUARIO en formularios, evaluaciones, recetas, solicitudes de estudios u otras herramientas. El USUARIO es responsable de verificar la veracidad y precisión de dichos datos. DoctorSoft no se responsabiliza por daños derivados del uso inadecuado del SITIO WEB y en ningún caso será responsable por pérdidas, daños o perjuicios de cualquier tipo surgidos del acceso o uso del SITIO WEB.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">V. DESCRIPCIÓN DEL SERVICIO</h2>
            <p>
              Este Sitio ofrece en la modalidad de software como servicio (SaaS) para médicos privados bajo un modelo de suscripción mensual, cancelable en cualquier momento sin reembolso del mes en curso. Se ofrecen distintos planes con diferentes limitaciones en consultorios, asistentes, usuarios y consultas. Las características y precios de los planes se encuentran en nuestra página de precios y podrán modificarse con un aviso previo de 30 días por correo electrónico. El USUARIO puede decidir continuar o cancelar su suscripción en cualquier momento.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">VI. PRIVACIDAD Y PROTECCIÓN DE DATOS</h2>
            <p>
              En cumplimiento con la legislación mexicana, DoctorSoft se compromete a adoptar las medidas necesarias para garantizar la privacidad y seguridad de los datos personales recabados, evitando su alteración, pérdida o tratamiento no autorizado. DoctorSoft será responsable del uso y protección de los datos ingresados por el USUARIO, conforme a las leyes mexicanas e internacionales en la materia y a los principios de licitud, calidad, finalidad, lealtad y responsabilidad. El tratamiento de datos personales estará sujeto al consentimiento de su titular, requiriéndose autorización expresa para datos financieros o patrimoniales, la cual podrá otorgarse a través del SITIO WEB. Se dará especial diligencia a los datos personales sensibles. Los datos personales en las bases de datos serán pertinentes, correctos y actualizados para los fines de su recolección. El acceso al SITIO WEB puede implicar el uso de cookies para mejorar la navegación y recopilar información anónima sobre la interacción del USUARIO (fecha, hora, tiempo de uso, sitios visitados, IP, frecuencia, etc.) con fines de mejora y detección de errores. El USUARIO puede deshabilitar las cookies en su navegador, lo que podría afectar algunas funcionalidades del SITIO WEB. La política de cookies podrá actualizarse, por lo que se recomienda revisar estos TÉRMINOS Y CONDICIONES.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">VII. POLÍTICA DE ENLACES</h2>
            <p>
             Los USUARIOS o terceros que enlacen este SITIO WEB desde páginas externas deberán abstenerse de reproducir (total o parcialmente) los contenidos, productos o servicios sin autorización expresa de DoctorSoft. Se prohíben manifestaciones falsas, inexactas o incorrectas sobre el SITIO WEB, sus contenidos, productos o servicios, reservándose DoctorSoft el derecho de restringir el acceso a quienes incurran en dichas conductas. El establecimiento de un enlace al SITIO WEB desde un sitio externo no implica relación alguna entre DoctorSoft y el titular de dicho sitio, ni el conocimiento o aprobación por parte de DoctorSoft de los contenidos, productos o servicios ofrecidos en el sitio enlazante.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">VIII. POLÍTICA EN MATERIA DE PROPIEDAD INTELECTUAL E INDUSTRIAL</h2>
            <p>
             DoctorSoft, por sí o como cesionario, es titular de todos los derechos de propiedad intelectual e industrial del SITIO WEB, incluyendo el código fuente, imágenes, audio, video, logotipos, marcas, combinaciones de colores, estructuras, diseños y demás elementos distintivos, protegidos por la legislación mexicana y tratados internacionales aplicables. Se prohíbe expresamente la reproducción, distribución o difusión de los contenidos del SITIO WEB con fines comerciales, en cualquier medio y sin autorización de DoctorSoft. El uso del SITIO WEB no otorga al USUARIO derechos de propiedad intelectual sobre el mismo ni sobre su contenido. Se prohíbe utilizar el nombre, marca o logotipo de DoctorSoft, así como eliminar, ocultar o alterar avisos legales. El USUARIO podrá visualizar, imprimir, copiar o almacenar elementos del SITIO WEB exclusivamente para su uso personal. Se prohíbe suprimir, alterar o manipular cualquier elemento, archivo o contenido del SITIO WEB, así como intentar vulnerar su seguridad o acceder a archivos o bases de datos protegidos sin autorización. Quien considere que algún contenido del SITIO WEB infringe derechos de propiedad industrial o intelectual deberá comunicarlo inmediatamente a DoctorSoft a través de los datos de contacto disponibles en el SITIO WEB.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">IX. LEGISLACIÓN Y JURISDICCIÓN APLICABLE</h2>
            <p>
              DoctorSoft se reserva el derecho de ejercer las acciones civiles o penales que considere necesarias por el uso indebido del SITIO WEB, sus contenidos, productos o servicios, o por el incumplimiento de estos TÉRMINOS Y CONDICIONES. La relación entre el USUARIO y DoctorSoft se regirá por la legislación vigente en México, específicamente en la ciudad de Querétaro, Querétaro. Cualquier controversia relacionada con la interpretación o aplicación de estos TÉRMINOS Y CONDICIONES se someterá a la jurisdicción de los tribunales competentes en dicha ubicación.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}