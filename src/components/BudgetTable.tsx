import { useState, useMemo } from 'react';
import { BudgetItem, GROUP_COLORS } from '@/lib/budget-types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Pencil, Check, X, ChevronDown, ChevronRight, Ungroup, FolderPlus, GripVertical, StickyNote } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function formatKRW(n: number) {
  return n.toLocaleString('ko-KR');
}

interface Props {
  items: BudgetItem[];
  editable?: boolean;
  onUpdate?: (id: string, updated: Partial<BudgetItem>) => void;
  onDelete?: (id: string) => void;
  onDeleteGroup?: (groupName: string) => void;
  onReorder?: (newItems: BudgetItem[]) => void;
}

interface EditForm {
  category: string;
  costType: string;
  description: string;
  budgetAmount: string;
  executedAmount: string;
  memo: string;
}

export default function BudgetTable({ items, editable = false, onUpdate, onDelete, onDeleteGroup, onReorder }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ category: '', costType: '', description: '', budgetAmount: '', executedAmount: '', memo: '' });
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [memoValue, setMemoValue] = useState('');
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState('');
  const [directEditId, setDirectEditId] = useState<string | null>(null);
  const [directEditAmount, setDirectEditAmount] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [assigningGroupId, setAssigningGroupId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [ungroupItem, setUngroupItem] = useState<BudgetItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const groupedItems = useMemo(() => {
    const groups = new Map<string, BudgetItem[]>();
    const ungrouped: BudgetItem[] = [];
    items.forEach(item => {
      if (item.group) {
        const list = groups.get(item.group) || [];
        list.push(item);
        groups.set(item.group, list);
      } else {
        ungrouped.push(item);
      }
    });
    return { groups, ungrouped };
  }, [items]);

  const groupNames = useMemo(() => Array.from(groupedItems.groups.keys()), [groupedItems]);

  const hasDrag = editable && !!onReorder;

  if (items.length === 0) {
    return (
      <div className="glass-card rounded-xl p-6 sm:p-8 text-center text-muted-foreground text-sm">
        아직 데이터가 없습니다. 엑셀 파일을 업로드하거나 직접 항목을 추가해주세요.
      </div>
    );
  }

  const startEdit = (item: BudgetItem) => {
    setEditingId(item.id);
    setEditForm({
      category: item.category,
      costType: item.costType,
      description: item.description,
      budgetAmount: String(item.budgetAmount),
      executedAmount: String(item.executedAmount),
      memo: item.memo || '',
    });
    setAddingId(null);
    setAssigningGroupId(null);
    setEditingMemoId(null);
  };

  const saveEdit = (item: BudgetItem) => {
    const budget = Number(editForm.budgetAmount.replace(/,/g, ''));
    const executed = Number(editForm.executedAmount.replace(/,/g, ''));
    if (isNaN(budget) || budget < 0) { toast.error('올바른 예산액을 입력해주세요.'); return; }
    if (isNaN(executed) || executed < 0) { toast.error('올바른 집행액을 입력해주세요.'); return; }
    const remaining = budget - executed;
    const rate = budget > 0 ? (executed / budget) * 100 : 0;
    onUpdate?.(item.id, {
      category: editForm.category,
      costType: editForm.costType,
      description: editForm.description,
      budgetAmount: budget,
      executedAmount: executed,
      remainingAmount: remaining,
      executionRate: rate,
      memo: editForm.memo,
    });
    setEditingId(null);
    toast.success('항목이 수정되었습니다.');
  };

  const startAddExecution = (item: BudgetItem) => {
    setAddingId(item.id);
    setAddAmount('');
    setEditingId(null);
    setAssigningGroupId(null);
    setDirectEditId(null);
    setEditingMemoId(null);
  };

  const startEditMemo = (item: BudgetItem) => {
    setEditingMemoId(item.id);
    setMemoValue(item.memo || '');
    setEditingId(null);
    setAddingId(null);
    setDirectEditId(null);
    setAssigningGroupId(null);
  };

  const saveMemo = (item: BudgetItem) => {
    onUpdate?.(item.id, { memo: memoValue });
    setEditingMemoId(null);
    toast.success('메모가 저장되었습니다.');
  };

  const startDirectEditExecution = (item: BudgetItem) => {
    setDirectEditId(item.id);
    setDirectEditAmount(String(item.executedAmount));
    setAddingId(null);
    setEditingId(null);
    setAssigningGroupId(null);
  };

  const saveDirectEditExecution = (item: BudgetItem) => {
    const newExecuted = Number(directEditAmount.replace(/,/g, ''));
    if (isNaN(newExecuted) || newExecuted < 0) { toast.error('올바른 금액을 입력해주세요.'); return; }
    const remaining = item.budgetAmount - newExecuted;
    const rate = item.budgetAmount > 0 ? (newExecuted / item.budgetAmount) * 100 : 0;
    onUpdate?.(item.id, { executedAmount: newExecuted, remainingAmount: remaining, executionRate: rate });
    setDirectEditId(null);
    toast.success('집행액이 수정되었습니다.');
  };

  const saveAddExecution = (item: BudgetItem) => {
    const amount = Number(addAmount.replace(/,/g, ''));
    if (isNaN(amount) || amount <= 0) { toast.error('올바른 금액을 입력해주세요.'); return; }
    const newExecuted = item.executedAmount + amount;
    const remaining = item.budgetAmount - newExecuted;
    const rate = item.budgetAmount > 0 ? (newExecuted / item.budgetAmount) * 100 : 0;
    onUpdate?.(item.id, { executedAmount: newExecuted, remainingAmount: remaining, executionRate: rate });
    setAddingId(null);
    toast.success(`${formatKRW(amount)}원이 집행 반영되었습니다.`);
  };

  const handleDelete = (item: BudgetItem) => {
    if (confirm(`"${item.description}" 항목을 삭제하시겠습니까?`)) {
      onDelete?.(item.id);
      toast.success('항목이 삭제되었습니다.');
    }
  };

  const handleDeleteGroup = (groupName: string, count: number) => {
    const cleanName = groupName.replace(/^\[초\]/, '').replace(/^\[초］/, '').replace(/^［초\]/, '').replace(/^［초］/, '');
    if (confirm(`"${cleanName}" 그룹의 ${count}건 항목을 모두 삭제하시겠습니까?`)) {
      onDeleteGroup?.(groupName);
      toast.success(`"${cleanName}" 그룹이 삭제되었습니다.`);
    }
  };

  const handleRemoveFromGroup = (item: BudgetItem) => {
    setUngroupItem(item);
  };

  const confirmRemoveFromGroup = () => {
    if (ungroupItem) {
      onUpdate?.(ungroupItem.id, { group: '', subCategory: '' });
      toast.success('그룹에서 해제되었습니다.');
      setUngroupItem(null);
    }
  };

  const handleAssignGroup = (item: BudgetItem, groupName: string) => {
    if (groupName === '__new__') return;
    onUpdate?.(item.id, { group: groupName, subCategory: groupName });
    setAssigningGroupId(null);
    toast.success(`"${groupName}" 그룹에 추가되었습니다.`);
  };

  const handleCreateAndAssignGroup = (item: BudgetItem) => {
    if (!newGroupName.trim()) { toast.error('그룹 이름을 입력해주세요.'); return; }
    const name = newGroupName.trim();
    onUpdate?.(item.id, { group: name, subCategory: name });
    setAssigningGroupId(null);
    setNewGroupName('');
    toast.success(`"${name}" 그룹이 생성되고 항목이 추가되었습니다.`);
  };

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupName)) next.delete(groupName);
      else next.add(groupName);
      return next;
    });
  };

  const getGroupColor = (groupName: string) => {
    const idx = groupNames.indexOf(groupName);
    return GROUP_COLORS[idx % GROUP_COLORS.length];
  };

  const getGroupSummary = (groupItems: BudgetItem[]) => {
    const budget = groupItems.reduce((s, i) => s + i.budgetAmount, 0);
    const executed = groupItems.reduce((s, i) => s + i.executedAmount, 0);
    const remaining = budget - executed;
    const rate = budget > 0 ? (executed / budget) * 100 : 0;
    return { budget, executed, remaining, rate };
  };

  // ── Drag handlers ──
  const handleGroupDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorder) return;
    const gNames = Array.from(groupedItems.groups.keys());
    const oldIndex = gNames.indexOf(active.id as string);
    const newIndex = gNames.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(gNames, oldIndex, newIndex);
    const newItems: BudgetItem[] = [];
    reordered.forEach(g => { newItems.push(...(groupedItems.groups.get(g) || [])); });
    newItems.push(...groupedItems.ungrouped);
    onReorder(newItems);
  };

  const handleItemDragEnd = (groupName: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorder) return;
    const gItems = groupedItems.groups.get(groupName) || [];
    const oldIndex = gItems.findIndex(i => i.id === active.id);
    const newIndex = gItems.findIndex(i => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(gItems, oldIndex, newIndex);
    const newItems: BudgetItem[] = [];
    Array.from(groupedItems.groups.entries()).forEach(([g, gi]) => {
      newItems.push(...(g === groupName ? reordered : gi));
    });
    newItems.push(...groupedItems.ungrouped);
    onReorder(newItems);
  };

  const handleUngroupedDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorder) return;
    const ug = groupedItems.ungrouped;
    const oldIndex = ug.findIndex(i => i.id === active.id);
    const newIndex = ug.findIndex(i => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(ug, oldIndex, newIndex);
    const newItems: BudgetItem[] = [];
    Array.from(groupedItems.groups.values()).forEach(gi => newItems.push(...gi));
    newItems.push(...reordered);
    onReorder(newItems);
  };

  // ── Sortable wrappers ──
  function SortableGroupWrapper({ groupName, children }: { groupName: string; children: (dragHandleProps: { listeners: any; attributes: any }) => React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: groupName });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
    return (
      <div ref={setNodeRef} style={style}>
        {children({ listeners, attributes })}
      </div>
    );
  }

  function SortableItemRow({ item, colorStyle }: { item: BudgetItem; colorStyle?: { bg: string } }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
    return (
      <tr ref={setNodeRef} style={style}>
        {renderRowCells(item, colorStyle, { listeners, attributes })}
      </tr>
    );
  }

  function SortableMobileItem({ item }: { item: BudgetItem }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
    return (
      <div ref={setNodeRef} style={style} className="flex items-start">
        <button {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing p-2 pt-3 text-muted-foreground hover:text-foreground touch-none">
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1">{renderMobileCard(item)}</div>
      </div>
    );
  }

  // ── Mobile card ──
  const renderMobileCard = (item: BudgetItem) => {
    const isAdding = addingId === item.id;

    return (
      <div key={item.id} className="p-3 border-b border-border/30 last:border-b-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-foreground leading-snug flex-1">{item.description}</p>
          {editable && (
            <div className="flex gap-0.5 shrink-0">
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => startEdit(item)}>
                <Pencil className="w-3 h-3" />
              </Button>
              {!item.group && (
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setAssigningGroupId(item.id); setEditingId(null); setAddingId(null); }}>
                  <FolderPlus className="w-3 h-3" />
                </Button>
              )}
              {item.group && (
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleRemoveFromGroup(item)}>
                  <Ungroup className="w-3 h-3" />
                </Button>
              )}
              <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => handleDelete(item)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <span className="text-muted-foreground">예산현액</span>
          <span className="text-right font-medium">{formatKRW(item.budgetAmount)}</span>
          <span className="text-muted-foreground">집행액</span>
          <span className="text-right font-medium">
            {isAdding ? (
              <div className="flex items-center gap-1 justify-end">
                <Input className="w-20 h-6 text-right text-xs" placeholder="추가 금액" value={addAmount} onChange={e => setAddAmount(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveAddExecution(item)} autoFocus />
                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => saveAddExecution(item)}><Check className="w-3 h-3 text-primary" /></Button>
                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setAddingId(null)}><X className="w-3 h-3" /></Button>
              </div>
            ) : directEditId === item.id ? (
              <div className="flex items-center gap-1 justify-end">
                <Input className="w-24 h-6 text-right text-xs" value={directEditAmount} onChange={e => setDirectEditAmount(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveDirectEditExecution(item)} autoFocus />
                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => saveDirectEditExecution(item)}><Check className="w-3 h-3 text-primary" /></Button>
                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setDirectEditId(null)}><X className="w-3 h-3" /></Button>
              </div>
            ) : editable ? (
              <div className="flex items-center gap-1 justify-end">
                <span className="text-xs">{formatKRW(item.executedAmount)}</span>
                <button className="text-[9px] text-primary underline" onClick={() => startAddExecution(item)}>추가</button>
              </div>
            ) : (
              <span>{formatKRW(item.executedAmount)}</span>
            )}
          </span>
          <span className="text-muted-foreground">잔액</span>
          <span className="text-right font-medium">{formatKRW(item.remainingAmount)}</span>
          <span className="text-muted-foreground">집행률</span>
          <span className="text-right">
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
              item.executionRate > 80 ? 'bg-destructive/10 text-destructive' :
              item.executionRate > 50 ? 'bg-accent/20 text-accent-foreground' :
              'bg-secondary text-secondary-foreground'
            }`}>
              {item.executionRate.toFixed(1)}%
            </span>
          </span>
        </div>
        {assigningGroupId === item.id && (
          <div className="mt-2 flex flex-col gap-2 p-2 bg-primary/5 rounded-lg">
            <span className="text-xs font-medium">그룹 지정</span>
            {groupNames.length > 0 && (
              <Select onValueChange={(val) => handleAssignGroup(item, val)}>
                <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="기존 그룹 선택" /></SelectTrigger>
                <SelectContent>
                  {groupNames.map(g => (
                    <SelectItem key={g} value={g}>{g.replace(/^\[초\]/, '').replace(/^\[초］/, '').replace(/^［초\]/, '').replace(/^［초］/, '')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="flex gap-1">
              <Input className="h-7 text-xs flex-1" placeholder="새 그룹 이름" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateAndAssignGroup(item)} />
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleCreateAndAssignGroup(item)}>생성</Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setAssigningGroupId(null); setNewGroupName(''); }}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
        {editingId === item.id && (
          <div className="mt-2 grid grid-cols-2 gap-2 p-2 bg-primary/5 rounded-lg">
            <Input className="h-7 text-xs col-span-2" placeholder="산출내역" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
            <Input className="h-7 text-xs" placeholder="세부사업" value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} />
            <Input className="h-7 text-xs" placeholder="비목" value={editForm.costType} onChange={e => setEditForm(f => ({ ...f, costType: e.target.value }))} />
            <Input className="h-7 text-xs" placeholder="예산현액" value={editForm.budgetAmount} onChange={e => setEditForm(f => ({ ...f, budgetAmount: e.target.value }))} />
            <Input className="h-7 text-xs" placeholder="집행액" value={editForm.executedAmount} onChange={e => setEditForm(f => ({ ...f, executedAmount: e.target.value }))} />
            <div className="col-span-2 flex gap-1 justify-end">
              <Button size="sm" className="h-7 text-xs" onClick={() => saveEdit(item)}>저장</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingId(null)}>취소</Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Desktop row cells (returned as fragment, used by SortableItemRow) ──
  const renderRowCells = (item: BudgetItem, colorStyle?: { bg: string }, dragProps?: { listeners: any; attributes: any }) => {
    const isEditing = editingId === item.id;
    const isAdding = addingId === item.id;
    const isAssigningGroup = assigningGroupId === item.id;

    if (isEditing) {
      return (
        <>
          {hasDrag && <TableCell />}
          <TableCell><Input className="h-7 text-sm" value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} /></TableCell>
          <TableCell><Input className="h-7 text-sm" value={editForm.costType} onChange={e => setEditForm(f => ({ ...f, costType: e.target.value }))} /></TableCell>
          <TableCell><Input className="h-7 text-sm" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} /></TableCell>
          <TableCell><Input className="h-7 text-sm text-right" value={editForm.budgetAmount} onChange={e => setEditForm(f => ({ ...f, budgetAmount: e.target.value }))} /></TableCell>
          <TableCell><Input className="h-7 text-sm text-right" value={editForm.executedAmount} onChange={e => setEditForm(f => ({ ...f, executedAmount: e.target.value }))} /></TableCell>
          <TableCell className="text-right text-sm text-muted-foreground">자동</TableCell>
          <TableCell className="text-right text-sm text-muted-foreground">자동</TableCell>
          <TableCell>
            <div className="flex gap-1 justify-end">
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveEdit(item)}><Check className="w-3.5 h-3.5 text-primary" /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}><X className="w-3.5 h-3.5" /></Button>
            </div>
          </TableCell>
        </>
      );
    }

    if (isAssigningGroup) {
      return (
        <>
          {hasDrag && <TableCell />}
          <TableCell colSpan={7}>
            <div className="flex items-center gap-3 py-1 flex-wrap">
              <span className="text-sm font-medium text-foreground whitespace-nowrap">"{item.description}" 그룹 지정:</span>
              {groupNames.length > 0 && (
                <Select onValueChange={(val) => handleAssignGroup(item, val)}>
                  <SelectTrigger className="w-48 h-8 text-sm"><SelectValue placeholder="기존 그룹 선택" /></SelectTrigger>
                  <SelectContent>
                    {groupNames.map(g => {
                      const clean = g.replace(/^\[초\]/, '').replace(/^\[초］/, '').replace(/^［초\]/, '').replace(/^［초］/, '');
                      return <SelectItem key={g} value={g}>{clean}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              )}
              <span className="text-sm text-muted-foreground">또는</span>
              <Input className="w-40 h-8 text-sm" placeholder="새 그룹 이름" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateAndAssignGroup(item)} />
              <Button size="sm" variant="outline" className="h-8 text-sm" onClick={() => handleCreateAndAssignGroup(item)}>생성</Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setAssigningGroupId(null); setNewGroupName(''); }}><X className="w-3.5 h-3.5" /></Button>
            </div>
          </TableCell>
          <TableCell />
        </>
      );
    }

    return (
      <>
        {hasDrag && dragProps ? (
          <TableCell className="w-8 px-1">
            <button {...dragProps.listeners} {...dragProps.attributes} className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground touch-none">
              <GripVertical className="w-3.5 h-3.5" />
            </button>
          </TableCell>
        ) : hasDrag ? <TableCell /> : null}
        <TableCell className="text-sm">{item.category}</TableCell>
        <TableCell className="text-sm">{item.costType}</TableCell>
        <TableCell className="text-sm">{item.description}</TableCell>
        <TableCell className="text-right text-sm font-medium">{formatKRW(item.budgetAmount)}</TableCell>
        <TableCell className="text-right text-sm">
          {isAdding ? (
            <div className="flex items-center gap-1 justify-end">
              <span className="text-xs text-muted-foreground whitespace-nowrap">{formatKRW(item.executedAmount)} +</span>
              <Input className="w-24 h-7 text-right text-sm" placeholder="추가 금액" value={addAmount} onChange={e => setAddAmount(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveAddExecution(item)} autoFocus />
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveAddExecution(item)}><Check className="w-3.5 h-3.5 text-primary" /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setAddingId(null)}><X className="w-3.5 h-3.5" /></Button>
            </div>
          ) : directEditId === item.id ? (
            <div className="flex items-center gap-1 justify-end">
              <Input className="w-28 h-7 text-right text-sm" value={directEditAmount} onChange={e => setDirectEditAmount(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveDirectEditExecution(item)} autoFocus />
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveDirectEditExecution(item)}><Check className="w-3.5 h-3.5 text-primary" /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDirectEditId(null)}><X className="w-3.5 h-3.5" /></Button>
            </div>
          ) : editable ? (
            <div className="flex items-center gap-1.5 justify-end">
              <span>{formatKRW(item.executedAmount)}</span>
              <button className="text-[10px] text-primary hover:underline" onClick={() => startAddExecution(item)}>추가</button>
            </div>
          ) : (
            <span>{formatKRW(item.executedAmount)}</span>
          )}
        </TableCell>
        <TableCell className="text-right text-sm">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            item.executionRate > 80 ? 'bg-destructive/10 text-destructive' :
            item.executionRate > 50 ? 'bg-accent/20 text-accent-foreground' :
            'bg-secondary text-secondary-foreground'
          }`}>
            {item.executionRate.toFixed(1)}%
          </span>
        </TableCell>
        <TableCell className="text-right text-sm font-medium">{formatKRW(item.remainingAmount)}</TableCell>
        {editable && (
          <TableCell>
            <div className="flex gap-1 justify-end">
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(item)} title="전체 수정"><Pencil className="w-3.5 h-3.5" /></Button>
              {!item.group && (
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setAssigningGroupId(item.id); setEditingId(null); setAddingId(null); }} title="그룹 지정"><FolderPlus className="w-3.5 h-3.5" /></Button>
              )}
              {item.group && (
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleRemoveFromGroup(item)} title="그룹 해제"><Ungroup className="w-3.5 h-3.5" /></Button>
              )}
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(item)} title="삭제"><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          </TableCell>
        )}
      </>
    );
  };

  // Legacy renderRow for non-drag contexts (Dashboard read-only)
  const renderRow = (item: BudgetItem, colorStyle?: { bg: string }) => (
    <TableRow key={item.id} style={colorStyle ? { backgroundColor: `hsl(${colorStyle.bg})` } : undefined}>
      {renderRowCells(item, colorStyle)}
    </TableRow>
  );

  const tableHeader = (
    <TableHeader>
      <TableRow className="bg-primary/5">
        {hasDrag && <TableHead className="w-8"></TableHead>}
        <TableHead className="font-semibold text-foreground">세부사업</TableHead>
        <TableHead className="font-semibold text-foreground">비목</TableHead>
        <TableHead className="font-semibold text-foreground">산출내역</TableHead>
        <TableHead className="text-right font-semibold text-foreground">예산현액</TableHead>
        <TableHead className="text-right font-semibold text-foreground">집행액</TableHead>
        <TableHead className="text-right font-semibold text-foreground">집행률</TableHead>
        <TableHead className="text-right font-semibold text-foreground">잔액</TableHead>
        {editable && <TableHead className="w-32"></TableHead>}
      </TableRow>
    </TableHeader>
  );

  // ── Render a single group block ──
  const renderGroupBlock = (groupName: string, groupItems: BudgetItem[], groupDragProps?: { listeners: any; attributes: any }) => {
    const color = getGroupColor(groupName);
    const summary = getGroupSummary(groupItems);
    const isCollapsed = collapsedGroups.has(groupName);
    const cleanName = groupName.replace(/^\[초\]/, '').replace(/^\[초］/, '').replace(/^［초\]/, '').replace(/^［초］/, '');

    return (
      <div key={groupName} className="rounded-xl overflow-hidden border" style={{ borderColor: `hsl(${color.border})` }}>
        <div
          className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 transition-colors hover:opacity-90"
          style={{ backgroundColor: `hsl(${color.bg})`, color: `hsl(${color.text})` }}
        >
          <div className="flex items-center gap-1 flex-1 min-w-0">
            {hasDrag && groupDragProps && (
              <button {...groupDragProps.listeners} {...groupDragProps.attributes} className="cursor-grab active:cursor-grabbing p-1 touch-none opacity-60 hover:opacity-100">
                <GripVertical className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => toggleGroup(groupName)} className="flex items-center gap-2 text-left flex-1 min-w-0">
              {isCollapsed ? <ChevronRight className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
              <span className="font-semibold text-sm sm:text-base truncate">{cleanName}</span>
              <span className="text-xs opacity-70 shrink-0">({groupItems.length}건)</span>
            </button>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="hidden sm:flex items-center gap-4 text-sm">
              <span>예산 <strong>{formatKRW(summary.budget)}</strong></span>
              <span>집행 <strong>{formatKRW(summary.executed)}</strong></span>
              <span>잔액 <strong>{formatKRW(summary.remaining)}</strong></span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              summary.rate > 80 ? 'bg-destructive/10 text-destructive' :
              summary.rate > 50 ? 'bg-accent/20 text-accent-foreground' :
              'bg-secondary text-secondary-foreground'
            }`}>
              {summary.rate.toFixed(1)}%
            </span>
            {editable && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 hover:bg-destructive/10"
                onClick={(e) => { e.stopPropagation(); handleDeleteGroup(groupName, groupItems.length); }}
                title="그룹 전체 삭제"
              >
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </Button>
            )}
          </div>
        </div>

        {!isCollapsed && (
          <>
            {/* Desktop table with item-level drag */}
            <div className="hidden md:block overflow-x-auto">
              {hasDrag ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemDragEnd(groupName)}>
                  <SortableContext items={groupItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    <Table>
                      {tableHeader}
                      <TableBody>
                        {groupItems.map(item => <SortableItemRow key={item.id} item={item} />)}
                      </TableBody>
                    </Table>
                  </SortableContext>
                </DndContext>
              ) : (
                <Table>
                  {tableHeader}
                  <TableBody>
                    {groupItems.map(item => renderRow(item))}
                  </TableBody>
                </Table>
              )}
            </div>
            {/* Mobile cards with item-level drag */}
            <div className="md:hidden">
              {hasDrag ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemDragEnd(groupName)}>
                  <SortableContext items={groupItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    {groupItems.map(item => <SortableMobileItem key={item.id} item={item} />)}
                  </SortableContext>
                </DndContext>
              ) : (
                groupItems.map(renderMobileCard)
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <>
    <div className="space-y-4">
      {/* Grouped items - with group-level drag */}
      {hasDrag ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleGroupDragEnd}>
          <SortableContext items={groupNames} strategy={verticalListSortingStrategy}>
            {Array.from(groupedItems.groups.entries()).map(([groupName, groupItems]) => (
              <SortableGroupWrapper key={groupName} groupName={groupName}>
                {(dragHandleProps) => renderGroupBlock(groupName, groupItems, dragHandleProps)}
              </SortableGroupWrapper>
            ))}
          </SortableContext>
        </DndContext>
      ) : (
        Array.from(groupedItems.groups.entries()).map(([groupName, groupItems]) =>
          renderGroupBlock(groupName, groupItems)
        )
      )}

      {/* Ungrouped items */}
      {groupedItems.ungrouped.length > 0 && (
        <div className="glass-card rounded-xl overflow-hidden">
          {groupedItems.groups.size > 0 && (
            <div className="px-3 sm:px-4 py-2 bg-muted/50 text-sm font-medium text-muted-foreground">
              그룹 미지정 항목 ({groupedItems.ungrouped.length}건)
            </div>
          )}
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            {hasDrag ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleUngroupedDragEnd}>
                <SortableContext items={groupedItems.ungrouped.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  <Table>
                    {tableHeader}
                    <TableBody>
                      {groupedItems.ungrouped.map(item => <SortableItemRow key={item.id} item={item} />)}
                    </TableBody>
                  </Table>
                </SortableContext>
              </DndContext>
            ) : (
              <Table>
                {tableHeader}
                <TableBody>
                  {groupedItems.ungrouped.map(item => renderRow(item))}
                </TableBody>
              </Table>
            )}
          </div>
          {/* Mobile cards */}
          <div className="md:hidden">
            {hasDrag ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleUngroupedDragEnd}>
                <SortableContext items={groupedItems.ungrouped.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  {groupedItems.ungrouped.map(item => <SortableMobileItem key={item.id} item={item} />)}
                </SortableContext>
              </DndContext>
            ) : (
              groupedItems.ungrouped.map(renderMobileCard)
            )}
          </div>
        </div>
      )}
    </div>

      <AlertDialog open={!!ungroupItem} onOpenChange={(open) => !open && setUngroupItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>그룹 해제</AlertDialogTitle>
            <AlertDialogDescription>
              '{ungroupItem?.description}' 항목을 그룹에서 해제하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveFromGroup}>해제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
