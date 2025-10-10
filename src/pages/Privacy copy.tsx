import React from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

export function Privacy() {
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
          Política de Protección de Datos Personales
        </h1>

        <div className="prose max-w-none space-y-6">
          <section>
            <p>
              En DoctorSoft, con domicilio en Calle de la Pradera 307 Despacho 109, Colonia del Prado, CP 76030, Querétaro Querétaro, nos comprometemos a proteger la privacidad de tus datos personales. Esta política describe cómo recopilamos, usamos, compartimos y protegemos tu información, en cumplimiento con la legislación mexicana aplicable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">1. Responsable del Tratamiento de Datos Personales</h2>
            <p>
              DoctorSoft es el responsable del tratamiento de los datos personales que se recaban a través de nuestro sistema de gestión de pacientes médico llamado DoctorSoft.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. Datos Personales Recabados</h2>
            <p>
              DoctorSoft podrá recabar las siguientes categorías de datos personales, dependiendo de la relación con el usuario software:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Datos de identificación y contacto: Nombre completo, domicilio, teléfono, correo electrónico.</li>
              <li>Datos profesionales: Cédula profesional, especialidad (para médicos).</li>
              <li>Datos de pacientes: Nombre, edad, sexo, teléfono, correo electrónico, domicilio, historial clínico, información sobre salud presente y futura.</li>
              <li>Datos de facturación: Datos fiscales para la emisión de comprobantes.</li>
              <li>Datos de uso del sistema: Registros de acceso y actividad dentro del software.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. Finalidades del Tratamiento de Datos Personales</h2>
            <p>Los datos personales recabados serán utilizados para las siguientes finalidades:</p>
            
            <h3 className="text-lg font-medium mt-4 mb-2">Finalidades primarias:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Prestar el servicio de CRM médico, incluyendo la gestión de expedientes clínicos, citas y demás funcionalidades.</li>
              <li>Gestionar cuentas de usuario y acceso al sistema.</li>
              <li>Proporcionar soporte técnico y atención al cliente.</li>
              <li>Realizar la facturación y cobranza de los servicios.</li>
              <li>Cumplir con obligaciones legales y normativas aplicables.</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">Finalidades secundarias:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Enviar información sobre actualizaciones, mejoras y nuevas funcionalidades del sistema (con consentimiento).</li>
              <li>Realizar encuestas de satisfacción y estudios de mercado (con consentimiento).</li>
              <li>Fines estadísticos y de mejora del servicio, con datos anonimizados.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. Transferencia de Datos Personales</h2>
            <p>DoctorSoft podrá transferir datos personales a terceros en los siguientes casos:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Proveedores de servicios que actúen en nuestro nombre y bajo nuestras instrucciones.</li>
              <li>Autoridades competentes, en cumplimiento de obligaciones legales.</li>
              <li>En caso de fusión, adquisición o venta de la empresa, que heredará estas obligaciones.</li>
            </ul>
            <p className="mt-4">En ningún caso DoctorSoft comercializará los datos personales de sus usuarios.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">5. Derechos ARCO</h2>
            <p>
              Los usuarios tienen derecho a acceder, rectificar, cancelar y oponerse al tratamiento de sus datos personales (Derechos ARCO). Para ejercer estos derechos, deberán presentar una solicitud por escrito a mceledon@doctorsoft.com.mx, que contenga:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Nombre completo y domicilio u otro medio para comunicar la respuesta.</li>
              <li>Documentos que acrediten la identidad del solicitante.</li>
              <li>Descripción clara y precisa de los datos personales sobre los que se busca ejercer el derecho ARCO.</li>
              <li>Cualquier otro elemento que facilite la localización de los datos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">6. Seguridad de los Datos Personales</h2>
            <p>
              DoctorSoft implementará las medidas de seguridad necesarias para proteger los datos personales contra daño, pérdida, alteración, destrucción o uso, acceso o tratamiento no autorizado.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">7. Conservación de los Datos Personales</h2>
            <p>
              Los datos personales se conservarán durante el tiempo necesario para cumplir con las finalidades para las que fueron recabados, así como para cumplir con las obligaciones legales aplicables.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">8. Cambios a esta Política</h2>
            <p>
              DoctorSoft se reserva el derecho de modificar esta Política de Protección de Datos Personales en cualquier momento. Los cambios se publicarán en nuestro sitio web o se comunicarán a los usuarios a través de los medios de contacto proporcionados.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">9. Contacto</h2>
            <p>
              En caso de dudas o comentarios sobre esta Política, los usuarios podrán contactarnos a través de mceledon@doctorsoft.com.mx o en la siguiente dirección:
            </p>
            <p className="mt-4">
              Calle de la Pradera 307 Despacho 109, Colonia del Prado, CP 76030, Querétaro Querétaro
            </p>
            <p className="mt-4">
              Fecha de última actualización: 18 de mayo de 2025.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}