import { useProjectStore } from "@/store/project-store";

export function EventTab() {
  const { project, setEvent } = useProjectStore();
  const e = project.event;

  return (
    <div className="space-y-4">
      <h3 className="text-avl-cyan text-xs font-bold tracking-wider uppercase border-b border-avl-border pb-2">
        Dati Evento
      </h3>

      <div>
        <label className="block text-avl-muted text-xs mb-1">Nome progetto *</label>
        <input
          type="text"
          value={e.projectName}
          onChange={(ev) => setEvent({ projectName: ev.target.value })}
          className="w-full bg-avl-bg2 border border-avl-border rounded px-3 py-2 text-sm text-white focus:border-avl-cyan outline-none"
        />
      </div>

      <div>
        <label className="block text-avl-muted text-xs mb-1">Cliente</label>
        <input
          type="text"
          value={e.client}
          onChange={(ev) => setEvent({ client: ev.target.value })}
          className="w-full bg-avl-bg2 border border-avl-border rounded px-3 py-2 text-sm text-white focus:border-avl-cyan outline-none"
        />
      </div>

      <div>
        <label className="block text-avl-muted text-xs mb-1">Luogo</label>
        <input
          type="text"
          value={e.location}
          onChange={(ev) => setEvent({ location: ev.target.value })}
          className="w-full bg-avl-bg2 border border-avl-border rounded px-3 py-2 text-sm text-white focus:border-avl-cyan outline-none"
        />
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-avl-muted text-xs mb-1">Data evento</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-avl-muted text-[10px]">Da</span>
              <input
                type="date"
                value={e.eventDateFrom ?? e.eventDate}
                onChange={(ev) => setEvent({ eventDateFrom: ev.target.value, eventDate: ev.target.value })}
                className="w-full bg-avl-bg2 border border-avl-border rounded px-2 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <span className="text-avl-muted text-[10px]">A</span>
              <input
                type="date"
                value={e.eventDateTo ?? e.eventDate}
                onChange={(ev) => setEvent({ eventDateTo: ev.target.value })}
                className="w-full bg-avl-bg2 border border-avl-border rounded px-2 py-1.5 text-xs text-white"
              />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-avl-muted text-xs mb-1">Montaggio</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-avl-muted text-[10px]">Da</span>
              <input
                type="date"
                value={e.setupDateFrom ?? e.setupDate}
                onChange={(ev) => setEvent({ setupDateFrom: ev.target.value, setupDate: ev.target.value })}
                className="w-full bg-avl-bg2 border border-avl-border rounded px-2 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <span className="text-avl-muted text-[10px]">A</span>
              <input
                type="date"
                value={e.setupDateTo ?? e.setupDate}
                onChange={(ev) => setEvent({ setupDateTo: ev.target.value })}
                className="w-full bg-avl-bg2 border border-avl-border rounded px-2 py-1.5 text-xs text-white"
              />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-avl-muted text-xs mb-1">Smontaggio</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-avl-muted text-[10px]">Da</span>
              <input
                type="date"
                value={e.teardownDateFrom ?? e.teardownDate}
                onChange={(ev) => setEvent({ teardownDateFrom: ev.target.value, teardownDate: ev.target.value })}
                className="w-full bg-avl-bg2 border border-avl-border rounded px-2 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <span className="text-avl-muted text-[10px]">A</span>
              <input
                type="date"
                value={e.teardownDateTo ?? e.teardownDate}
                onChange={(ev) => setEvent({ teardownDateTo: ev.target.value })}
                className="w-full bg-avl-bg2 border border-avl-border rounded px-2 py-1.5 text-xs text-white"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-avl-muted text-xs mb-1">Progettista</label>
        <input
          type="text"
          value={e.designer}
          onChange={(ev) => setEvent({ designer: ev.target.value })}
          className="w-full bg-avl-bg2 border border-avl-border rounded px-3 py-2 text-sm text-white"
        />
      </div>

      <div>
        <label className="block text-avl-muted text-xs mb-1">Note</label>
        <textarea
          value={e.notes}
          onChange={(ev) => setEvent({ notes: ev.target.value })}
          rows={3}
          className="w-full bg-avl-bg2 border border-avl-border rounded px-3 py-2 text-sm text-white resize-none"
        />
      </div>
    </div>
  );
}
