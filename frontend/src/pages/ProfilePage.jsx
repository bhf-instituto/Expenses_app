import MobileShell from '../components/MobileShell';

export default function ProfilePage({ auth }) {
  return (
    <MobileShell title="Perfil" backTo="/">
      <div className="box">
        <p className="mb-2"><strong>Email:</strong> {auth?.user?.email}</p>
        <p className="is-size-7 has-text-grey">Esta pantalla queda preparada para futuras opciones de cuenta.</p>
      </div>
    </MobileShell>
  );
}
