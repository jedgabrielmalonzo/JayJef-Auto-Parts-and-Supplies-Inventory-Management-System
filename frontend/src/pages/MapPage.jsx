import { useEffect, useRef, useState } from 'react';
import { Search, MapPin, Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { getProductLocations } from '../api/products.js';
import { listCabinets, createCabinet, updateCabinet, deleteCabinet } from '../api/shopLayout.js';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Label } from '../components/ui/label.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog.jsx';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '../components/ui/alert-dialog.jsx';

// No red — red is reserved as the single "you're looking for this one"
// highlight signal (docs/09).
const COLOR_OPTIONS = [
  { value: '#3A6EA5', label: 'Blue' },
  { value: '#1E7B34', label: 'Green' },
  { value: '#946200', label: 'Amber' },
  { value: '#6B6B6B', label: 'Gray' },
  { value: '#7C3AED', label: 'Purple' },
];

function CabinetFormDialog({ open, cabinet, onClose, onSaved }) {
  const isEdit = !!cabinet;
  const [label, setLabel] = useState('');
  const [aisle, setAisle] = useState('');
  const [width, setWidth] = useState('120');
  const [height, setHeight] = useState('80');
  const [color, setColor] = useState(COLOR_OPTIONS[0].value);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setLabel(cabinet?.label ?? '');
    setAisle(cabinet?.location_aisle ?? '');
    setWidth(cabinet ? String(cabinet.width) : '120');
    setHeight(cabinet ? String(cabinet.height) : '80');
    setColor(cabinet?.color ?? COLOR_OPTIONS[0].value);
    setFieldErrors({});
  }, [open, cabinet]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await updateCabinet(cabinet.id, { label, location_aisle: aisle, width: Number(width), height: Number(height), color });
        toast.success('Cabinet updated');
      } else {
        await createCabinet({ label, location_aisle: aisle, width: Number(width), height: Number(height), color, x: 40, y: 40 });
        toast.success('Cabinet added');
      }
      onSaved();
    } catch (err) {
      if (err.fields) setFieldErrors(err.fields);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Cabinet' : 'Add Cabinet'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Label<span className="text-red-600">*</span></Label>
            <Input placeholder="e.g. Aisle A4" value={label} onChange={(e) => setLabel(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Aisle Code<span className="text-red-600">*</span></Label>
            <Input
              className="font-mono"
              placeholder="e.g. A4"
              value={aisle}
              onChange={(e) => setAisle(e.target.value)}
              aria-invalid={!!fieldErrors.location_aisle}
              required
            />
            {fieldErrors.location_aisle && <p className="text-sm text-red-700">Already used by another cabinet.</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Width</Label>
              <Input type="number" min="20" className="tabular-nums" value={width} onChange={(e) => setWidth(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Height</Label>
              <Input type="number" min="20" className="tabular-nums" value={height} onChange={(e) => setHeight(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger className="w-full">
                <SelectValue>{(v) => COLOR_OPTIONS.find((c) => c.value === v)?.label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {COLOR_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    <span className="inline-flex items-center gap-2">
                      <span className="size-3 rounded-sm" style={{ backgroundColor: c.value }} />
                      {c.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Cabinet'}</Button>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Cabinet({ cabinet, editMode, highlighted, onDragEnd, onEdit, onDelete }) {
  const [pos, setPos] = useState({ x: Number(cabinet.x), y: Number(cabinet.y) });
  const dragRef = useRef(null);

  useEffect(() => {
    setPos({ x: Number(cabinet.x), y: Number(cabinet.y) });
  }, [cabinet.x, cabinet.y]);

  function onPointerDown(e) {
    if (!editMode) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startClientX: e.clientX, startClientY: e.clientY, startX: pos.x, startY: pos.y };
  }
  function onPointerMove(e) {
    if (!dragRef.current) return;
    setPos({
      x: dragRef.current.startX + (e.clientX - dragRef.current.startClientX),
      y: dragRef.current.startY + (e.clientY - dragRef.current.startClientY),
    });
  }
  function onPointerUp() {
    if (!dragRef.current) return;
    dragRef.current = null;
    onDragEnd(cabinet, pos);
  }

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className={`absolute flex select-none flex-col items-center justify-center rounded text-center text-xs font-bold text-white shadow-sm transition-shadow ${editMode ? 'cursor-grab active:cursor-grabbing' : ''} ${highlighted ? 'ring-4 ring-red-600 ring-offset-2' : ''}`}
      style={{ left: pos.x, top: pos.y, width: Number(cabinet.width), height: Number(cabinet.height), backgroundColor: cabinet.color }}
    >
      {cabinet.label}
      {editMode && (
        <div className="absolute -top-3 -right-3 flex gap-1">
          <button
            type="button"
            title="Edit"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onEdit(cabinet)}
            className="flex size-6 items-center justify-center rounded-full border border-gray-300 bg-white text-black-700 shadow-sm hover:bg-gray-50"
          >
            <Pencil size={11} />
          </button>
          <button
            type="button"
            title="Delete"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onDelete(cabinet)}
            className="flex size-6 items-center justify-center rounded-full border border-gray-300 bg-white text-black-700 shadow-sm hover:bg-red-50 hover:text-red-600"
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function MapPage() {
  const [cabinets, setCabinets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formCabinet, setFormCabinet] = useState(undefined); // undefined = closed, null = new, object = editing
  const [pendingDelete, setPendingDelete] = useState(null);

  const [query, setQuery] = useState('');
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);

  function load() {
    setLoading(true);
    listCabinets().then(setCabinets).catch((err) => toast.error(err.message)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!query) { setOptions([]); return; }
    const timeout = setTimeout(() => {
      getProductLocations({ search: query }).then(setOptions).catch(() => {});
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  const highlightedCabinet = selected ? cabinets.find((c) => c.location_aisle === selected.location_aisle) : null;

  async function handleDragEnd(cabinet, pos) {
    setCabinets((list) => list.map((c) => (c.id === cabinet.id ? { ...c, x: pos.x, y: pos.y } : c)));
    try {
      await updateCabinet(cabinet.id, { x: Math.round(pos.x), y: Math.round(pos.y) });
    } catch (err) {
      toast.error(err.message);
      load(); // snap back to the last known-good server state
    }
  }

  async function handleDelete() {
    try {
      await deleteCabinet(pendingDelete.id);
      toast.success('Cabinet deleted');
      setPendingDelete(null);
      load();
    } catch (err) {
      toast.error(err.message);
      setPendingDelete(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-black-900">Shop Map</h1>
          <div className="h-1 w-16 bg-black-900 mt-2" />
        </div>
        <div className="flex items-center gap-2">
          {editMode && (
            <Button variant="secondary" onClick={() => setFormCabinet(null)}>
              <Plus size={16} strokeWidth={2.5} />
              Add Cabinet
            </Button>
          )}
          <Button variant={editMode ? 'default' : 'secondary'} onClick={() => setEditMode((v) => !v)}>
            <Pencil size={16} strokeWidth={2.5} />
            {editMode ? 'Done Editing' : 'Edit Layout'}
          </Button>
        </div>
      </div>

      {!editMode && (
        <div className="relative mb-4 max-w-sm">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black-500" />
          <Input
            className="pl-9"
            placeholder="Search a product to locate it..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
          />
          {options.length > 0 && !selected && (
            <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded border border-gray-200 bg-white shadow-md">
              {options.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                  onClick={() => { setSelected(p); setQuery(`${p.sku} — ${p.name}`); setOptions([]); }}
                >
                  <span className="font-mono">{p.sku}</span> — {p.name}
                </button>
              ))}
            </div>
          )}
          {selected && !highlightedCabinet && (
            <div className="absolute z-10 mt-1 w-full rounded border border-amber-700 bg-amber-100 px-3 py-2 text-sm text-amber-700">
              This product's aisle ({selected.location_aisle || 'not set'}) isn't on the map yet.
            </div>
          )}
        </div>
      )}

      {editMode && (
        <p className="mb-4 text-sm text-black-500">Drag cabinets to match your real floor plan. Changes save as you go.</p>
      )}

      <div className="relative h-[560px] overflow-auto rounded-lg border border-gray-200 bg-gray-50 shadow-sm">
        <div
          className="relative"
          style={{
            width: 900,
            height: 650,
            backgroundImage: 'linear-gradient(to right, #E4E4E4 1px, transparent 1px), linear-gradient(to bottom, #E4E4E4 1px, transparent 1px)',
            backgroundSize: '25px 25px',
          }}
        >
          {!loading && cabinets.map((c) => (
            <Cabinet
              key={c.id}
              cabinet={c}
              editMode={editMode}
              highlighted={highlightedCabinet?.id === c.id}
              onDragEnd={handleDragEnd}
              onEdit={setFormCabinet}
              onDelete={setPendingDelete}
            />
          ))}
        </div>
      </div>

      {highlightedCabinet && selected && (
        <div className="mt-3 inline-flex flex-col gap-0.5 rounded border border-red-600 bg-white px-3 py-2 text-sm shadow-sm">
          <p className="font-mono font-medium text-black-900">{selected.sku}</p>
          <p className="text-black-700">{selected.name}</p>
          <p className="text-black-500">
            {[selected.location_aisle, selected.location_shelf, selected.location_bin].filter(Boolean).join(' / ')}
          </p>
        </div>
      )}

      {!editMode && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-black-500">
          <MapPin size={13} />
          A static reference for where things are — not a live tracker.
        </p>
      )}

      <CabinetFormDialog
        open={formCabinet !== undefined}
        cabinet={formCabinet}
        onClose={() => setFormCabinet(undefined)}
        onSaved={() => { setFormCabinet(undefined); load(); }}
      />

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this cabinet?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete ? `"${pendingDelete.label}" will be removed from the map. Products still keep their aisle code, they just won't be highlighted on the map anymore. This can't be undone.` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              <Trash2 size={16} />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
