import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileShell from '../components/MobileShell';
import { api } from '../services/api';

export default function CreateSetPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    try {
      await api.createSet(name);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <MobileShell title="Crear grupo" backTo="/">
      <form className="box" onSubmit={submit}>
        <div className="field">
          <label className="label">Nombre del grupo</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        {error ? <p className="help is-danger mb-2">{error}</p> : null}
        <button className="button is-primary is-fullwidth" type="submit">Crear</button>
      </form>
    </MobileShell>
  );
}
