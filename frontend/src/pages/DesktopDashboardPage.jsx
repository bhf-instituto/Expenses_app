import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import connectionIcon from '../assets/icons/connection-icon.svg';
import offlineIcon from '../assets/icons/connection-offline-icon.svg';
import pendingIcon from '../assets/icons/pending-icon.svg';
import pencilIcon from '../assets/icons/pencil-icon.svg';
import closeLineIcon from '../assets/icons/close-line-icon.svg';
import starEmptyIcon from '../assets/icons/star-empty-icon.svg';
import starFullIcon from '../assets/icons/star-full-icon.svg';
import MonoIcon from '../components/MonoIcon.jsx';
import WrappedChoiceGroup from '../components/WrappedChoiceGroup.jsx';
import WrappedMultiChoiceGroup from '../components/WrappedMultiChoiceGroup.jsx';
import { ApiError, categoriesApi, expensesApi, setsApi } from '../lib/apiClient.js';
import { EXPENSE_TYPES, PAYMENT_METHODS, getExpenseTypeById, getPaymentMethodById } from '../constants/catalogs.js';
import {
  getCachedCategories,
  getCachedExpenses,
  getCachedSets,
  getCachedSetUsers,
  setCachedCategories,
  setCachedExpenses,
  setCachedSets,
  setCachedSetUsers,
} from '../lib/localCache.js';
import {
  clearFavoriteGroup,
  getFavoriteGroupId,
  sortByFavorites,
  toggleFavoriteGroup,
} from '../lib/favoritesStorage.js';
import { resolveSessionScope } from '../lib/sessionScope.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useExpenseSync } from '../context/ExpenseSyncContext.jsx';
import useFlipListAnimation from '../hooks/useFlipListAnimation.js';

const TAB = {
  EXPENSES: 'expenses',
  CATEGORIES: 'categories',
  USERS: 'users',
};

const createTempId = () => -Math.floor(Date.now() + Math.random() * 100000);
const formatDateOnly = (value) => String(value || '').slice(0, 10);
const getEmailAlias = (email) => String(email || '').split('@')[0] || String(email || '');
const normalizeInt = (value) => {
  const normalized = Number(value);
  return Number.isInteger(normalized) ? normalized : null;
};
const resolvePreferredSetId = (setList, currentSetId, favoriteSetId) => {
  if (!Array.isArray(setList) || setList.length === 0) return null;
  const favoriteId = normalizeInt(favoriteSetId);
  const selectedId = normalizeInt(currentSetId);

  if (favoriteId !== null && setList.some((group) => Number(group.id) === favoriteId)) {
    return favoriteId;
  }
  if (selectedId !== null && setList.some((group) => Number(group.id) === selectedId)) {
    return selectedId;
  }
  return normalizeInt(setList[0]?.id);
};
const toggleListValue = (list, value) => {
  const asString = String(value);
  return list.includes(asString)
    ? list.filter((item) => String(item) !== asString)
    : [...list, asString];
};
const CATEGORY_FILTER_TONES = {
  '1': {
    active: 'border border-app-ink/60 bg-app-mint text-app-ink',
    inactive: 'border border-app-ink/20 bg-app-panel text-app-muted hover:bg-app-bg',
  },
  '2': {
    active: 'border border-app-ink/60 bg-app-mint text-app-ink',
    inactive: 'border border-app-ink/20 bg-app-panel text-app-muted hover:bg-app-bg',
  },
  '3': {
    active: 'border border-app-ink/60 bg-app-mint text-app-ink',
    inactive: 'border border-app-ink/20 bg-app-panel text-app-muted hover:bg-app-bg',
  },
};
const defaultFilters = {
  expense_type_ids: [],
  payment_method_ids: [],
  user_ids: [],
  category_ids: [],
  from_date: '',
  to_date: '',
};
const defaultExpenseForm = {
  expense_type: '1',
  category_id: '',
  amount: '',
  payment_method: '1',
  user_id: '',
  expense_date: new Date().toISOString().slice(0, 10),
  description: '',
};
const EXPENSE_SORT_DEFAULT_DIRECTION = {
  category: 'asc',
  amount: 'desc',
  type: 'asc',
  payment: 'asc',
  user: 'asc',
  date: 'asc',
};

function DesktopModal({ open, title, children, onClose, maxWidthClass = 'max-w-lg' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
      <div className={`w-full ${maxWidthClass} rounded-2xl bg-app-panel p-4 shadow-card`}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-heading text-sm font-extrabold uppercase tracking-wide text-app-ink">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-app-bg/35 px-2 py-1 text-xs font-bold uppercase tracking-wide text-app-muted"
          >
            Cerrar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function DesktopDashboardPage() {
  const navigate = useNavigate();
  const { user, logout, isOnline } = useAuth();
  const { pendingCount, queueAction, queueExpense } = useExpenseSync();
  const scope = resolveSessionScope(user);
  const persistedFavoriteGroupId = getFavoriteGroupId(scope);

  const [tab, setTab] = useState(TAB.EXPENSES);
  const [groups, setGroups] = useState(() => getCachedSets(scope));
  const [favoriteGroupId, setFavoriteGroupId] = useState(() => persistedFavoriteGroupId);
  const [selectedSetId, setSelectedSetId] = useState(() => {
    const cached = getCachedSets(scope);
    return resolvePreferredSetId(cached, null, persistedFavoriteGroupId);
  });
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [filtersDraft, setFiltersDraft] = useState(defaultFilters);
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);
  const [categoryFilterPaneIndex, setCategoryFilterPaneIndex] = useState(0);
  const [groupNameForm, setGroupNameForm] = useState('');
  const [groupActionModal, setGroupActionModal] = useState({
    open: false,
    mode: '',
    step: 1,
    groupId: null,
    groupName: '',
    newName: '',
    confirmWord: '',
  });
  const [categoryForm, setCategoryForm] = useState({
    editingId: null,
    name: '',
    expense_type: '1',
  });
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState(defaultExpenseForm);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: '',
    payload: null,
    title: '',
    description: '',
    confirmLabel: 'Confirmar',
    deleteExpenses: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [expandedExpenseIds, setExpandedExpenseIds] = useState([]);
  const [expenseSort, setExpenseSort] = useState({ key: null, direction: 'asc' });
  const expensesScrollRef = useRef(null);
  const [expensesScrollProgress, setExpensesScrollProgress] = useState(0);

  const selectedGroup = useMemo(
    () => groups.find((group) => Number(group.id) === Number(selectedSetId)) || null,
    [groups, selectedSetId]
  );
  const sortedGroups = useMemo(
    () => sortByFavorites(groups, (group) => Number(group.id) === Number(favoriteGroupId)),
    [groups, favoriteGroupId]
  );
  const sortedGroupIds = useMemo(() => sortedGroups.map((group) => group.id), [sortedGroups]);
  const isSelectedGroupFavorite = Number(selectedGroup?.id) === Number(favoriteGroupId);
  const isAdmin = Number(selectedGroup?.role) === 1;
  const setAnimatedGroupRef = useFlipListAnimation(sortedGroupIds);

  const commitGroups = useCallback((next) => {
    setGroups(next);
    setCachedSets(next, scope);
  }, [scope]);

  const loadGroups = useCallback(async () => {
    const cached = getCachedSets(scope);
    if (cached.length > 0) {
      setGroups(cached);
      setSelectedSetId((prev) => resolvePreferredSetId(cached, prev, favoriteGroupId));
    }
    if (!isOnline) return;
    try {
      const data = await setsApi.getAll();
      const next = data?.sets || [];
      commitGroups(next);
      setSelectedSetId((prev) => resolvePreferredSetId(next, prev, favoriteGroupId));
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'No se pudieron cargar los grupos');
    }
  }, [commitGroups, favoriteGroupId, isOnline, scope]);

  const loadSetData = useCallback(async (setId) => {
    if (!setId || Number(setId) <= 0) {
      setCategories([]);
      setUsers([]);
      setExpenses([]);
      return;
    }
    setLoading(true);
    setError('');

    setCategories(getCachedCategories(setId, undefined, scope));
    setUsers(getCachedSetUsers(setId, scope));
    setExpenses(getCachedExpenses(setId, scope));

    if (!isOnline) {
      setLoading(false);
      return;
    }

    try {
      const [cats, groupUsers, exps] = await Promise.all([
        categoriesApi.getAll(setId, undefined),
        setsApi.getUsers(setId),
        expensesApi.getAll(setId, { page: 1, limit: 100 }),
      ]);
      const nextCategories = cats?.categories || [];
      const nextUsers = groupUsers?.users || [];
      const nextExpenses = Array.isArray(exps) ? exps : [];
      setCategories(nextCategories);
      setUsers(nextUsers);
      setExpenses(nextExpenses);
      setCachedCategories(setId, undefined, nextCategories, scope);
      setCachedSetUsers(setId, nextUsers, scope);
      setCachedExpenses(setId, nextExpenses, scope);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'No se pudieron cargar datos del grupo');
    } finally {
      setLoading(false);
    }
  }, [isOnline, scope]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    if (selectedSetId) loadSetData(selectedSetId);
  }, [selectedSetId, loadSetData]);

  useEffect(() => {
    setFavoriteGroupId(getFavoriteGroupId(scope));
  }, [scope]);

  useEffect(() => {
    if (!favoriteGroupId) return;
    if (!groups.some((group) => Number(group.id) === Number(favoriteGroupId))) return;
    setSelectedSetId((prev) => (Number(prev) === Number(favoriteGroupId) ? prev : Number(favoriteGroupId)));
  }, [favoriteGroupId, groups]);

  useEffect(() => {
    if (!favoriteGroupId) return;
    const exists = groups.some((group) => Number(group.id) === Number(favoriteGroupId));
    if (exists) return;
    clearFavoriteGroup(scope);
    setFavoriteGroupId(null);
  }, [favoriteGroupId, groups, scope]);

  useEffect(() => {
    if (!isOnline || pendingCount !== 0) return;
    loadGroups();
  }, [isOnline, pendingCount, loadGroups]);

  useEffect(() => {
    if (!expenseModalOpen) return;
    if (editingExpenseId) return;

    setExpenseForm((prev) => {
      const next = { ...prev };
      if (!next.user_id && user?.id) {
        next.user_id = String(user.id);
      }

      const selectedType = Number(next.expense_type || 1);
      const validCategories = categories.filter(
        (category) => Number(category.expense_type) === selectedType
      );
      if (
        !next.category_id ||
        !validCategories.some((category) => String(category.id) === String(next.category_id))
      ) {
        next.category_id = validCategories[0] ? String(validCategories[0].id) : '';
      }

      return next;
    });
  }, [categories, editingExpenseId, expenseModalOpen, user?.id]);

  const filteredExpenses = useMemo(
    () =>
      expenses.filter((expense) => {
        const expenseType = String(expense.expense_type || '');
        const paymentMethod = String(expense.payment_method || '');
        const expenseUserId = String(expense.user_id || '');
        const expenseCategoryId = String(expense.category_id || '');
        const expenseDate = formatDateOnly(expense.expense_date);

        if (
          filters.expense_type_ids.length > 0
          && !filters.expense_type_ids.includes(expenseType)
        ) {
          return false;
        }
        if (
          filters.payment_method_ids.length > 0
          && !filters.payment_method_ids.includes(paymentMethod)
        ) {
          return false;
        }
        if (filters.user_ids.length > 0 && !filters.user_ids.includes(expenseUserId)) {
          return false;
        }
        if (filters.category_ids.length > 0 && !filters.category_ids.includes(expenseCategoryId)) {
          return false;
        }
        if (filters.from_date && expenseDate < filters.from_date) {
          return false;
        }
        if (filters.to_date && expenseDate > filters.to_date) {
          return false;
        }
        return true;
      }),
    [expenses, filters]
  );

  const sortedFilteredExpenses = useMemo(() => {
    if (!expenseSort.key) return filteredExpenses;

    const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });
    const direction = expenseSort.direction === 'desc' ? 'desc' : 'asc';
    const typeOrder = direction === 'asc' ? [1, 2, 3] : [3, 2, 1];
    const paymentOrder = direction === 'asc' ? [1, 3, 2] : [2, 3, 1];
    const typeRank = new Map(typeOrder.map((value, index) => [value, index]));
    const paymentRank = new Map(paymentOrder.map((value, index) => [value, index]));

    return filteredExpenses
      .map((expense, index) => ({ expense, index }))
      .sort((left, right) => {
        const a = left.expense;
        const b = right.expense;

        let result = 0;
        switch (expenseSort.key) {
          case 'category':
            result = collator.compare(String(a.category_name || ''), String(b.category_name || ''));
            break;
          case 'amount': {
            const amountA = Number(a.amount || 0);
            const amountB = Number(b.amount || 0);
            result = amountA - amountB;
            break;
          }
          case 'type': {
            const rankA = typeRank.get(Number(a.expense_type));
            const rankB = typeRank.get(Number(b.expense_type));
            result = (rankA ?? Number.MAX_SAFE_INTEGER) - (rankB ?? Number.MAX_SAFE_INTEGER);
            break;
          }
          case 'payment': {
            const rankA = paymentRank.get(Number(a.payment_method));
            const rankB = paymentRank.get(Number(b.payment_method));
            result = (rankA ?? Number.MAX_SAFE_INTEGER) - (rankB ?? Number.MAX_SAFE_INTEGER);
            break;
          }
          case 'user':
            result = collator.compare(
              getEmailAlias(a.user_email || ''),
              getEmailAlias(b.user_email || '')
            );
            break;
          case 'date':
            result = collator.compare(formatDateOnly(a.expense_date), formatDateOnly(b.expense_date));
            break;
          default:
            result = 0;
        }

        if (result === 0) {
          return left.index - right.index;
        }

        if (expenseSort.key === 'type' || expenseSort.key === 'payment') {
          return result;
        }

        return direction === 'desc' ? result * -1 : result;
      })
      .map((item) => item.expense);
  }, [expenseSort, filteredExpenses]);

  const toggleExpenseSort = (key) => {
    setExpenseSort((prev) => {
      if (prev.key !== key) {
        return {
          key,
          direction: EXPENSE_SORT_DEFAULT_DIRECTION[key] || 'asc',
        };
      }

      return {
        key,
        direction: prev.direction === 'asc' ? 'desc' : 'asc',
      };
    });
  };

  const getSortIndicator = (key) => {
    if (expenseSort.key !== key) return '';
    return expenseSort.direction === 'asc' ? '↑' : '↓';
  };

  useEffect(() => {
    setExpandedExpenseIds((prev) =>
      prev.filter((expandedId) =>
        filteredExpenses.some((expense) => Number(expense.id) === Number(expandedId))
      )
    );
  }, [filteredExpenses]);

  const totalAmount = useMemo(
    () => filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    [filteredExpenses]
  );

  const expenseTypeOptions = useMemo(
    () =>
      EXPENSE_TYPES.map((type) => ({
        value: String(type.id),
        label: type.shortLabel || type.label,
      })),
    []
  );

  const categoryChoiceOptions = useMemo(() => {
    const selectedType = Number(expenseForm.expense_type || 1);
    return categories
      .filter((category) => Number(category.expense_type) === selectedType)
      .map((category) => ({
        value: String(category.id),
        label: category.name,
      }));
  }, [categories, expenseForm.expense_type]);

  const paymentMethodOptions = useMemo(
    () =>
      PAYMENT_METHODS.map((method) => ({
        value: String(method.id),
        label: method.shortLabel || method.label,
      })),
    []
  );

  const userFilterOptions = useMemo(() => {
    const currentUserId = Number(user?.id);
    const options = [];
    if (Number.isInteger(currentUserId) && currentUserId > 0) {
      options.push({ value: String(currentUserId), label: 'Yo' });
    }
    users
      .filter((groupUser) => Number(groupUser.id) !== currentUserId)
      .forEach((groupUser) => {
        options.push({
          value: String(groupUser.id),
          label: getEmailAlias(groupUser.email),
        });
      });
    return options;
  }, [user?.id, users]);

  const categoryFilterTypeIds = useMemo(() => {
    const allTypeIds = EXPENSE_TYPES.map((type) => String(type.id));
    if (filtersDraft.expense_type_ids.length === 0) return allTypeIds;
    const selectedTypeSet = new Set(filtersDraft.expense_type_ids.map(String));
    return allTypeIds.filter((typeId) => selectedTypeSet.has(typeId));
  }, [filtersDraft.expense_type_ids]);

  const categoryFilterPanes = useMemo(
    () =>
      categoryFilterTypeIds.map((typeId) => ({
        typeId,
        typeLabel: getExpenseTypeById(typeId)?.shortLabel || getExpenseTypeById(typeId)?.label || '',
        options: categories
          .filter((category) => String(category.expense_type) === String(typeId))
          .map((category) => ({
            value: String(category.id),
            label: category.name,
          })),
      })),
    [categories, categoryFilterTypeIds]
  );

  const currentCategoryFilterTypeId =
    categoryFilterTypeIds[Math.min(categoryFilterPaneIndex, Math.max(0, categoryFilterTypeIds.length - 1))] || '';

  const activeFiltersCount = useMemo(
    () =>
      filters.expense_type_ids.length
      + filters.payment_method_ids.length
      + filters.user_ids.length
      + filters.category_ids.length
      + (filters.from_date ? 1 : 0)
      + (filters.to_date ? 1 : 0),
    [filters]
  );

  useEffect(() => {
    if (!filtersModalOpen) return;
    setCategoryFilterPaneIndex(0);
  }, [filtersModalOpen]);

  useEffect(() => {
    setCategoryFilterPaneIndex((prev) => {
      if (categoryFilterTypeIds.length === 0) return 0;
      return Math.min(prev, categoryFilterTypeIds.length - 1);
    });
  }, [categoryFilterTypeIds]);

  const creatorOptions = useMemo(() => {
    const currentUserId = Number(user?.id);
    const options = [];

    if (Number.isInteger(currentUserId) && currentUserId > 0) {
      options.push({ value: String(currentUserId), label: 'Yo' });
    }

    users
      .filter((groupUser) => Number(groupUser.id) !== currentUserId)
      .forEach((groupUser) => {
        options.push({
          value: String(groupUser.id),
          label: getEmailAlias(groupUser.email),
        });
      });

    return options;
  }, [user?.id, users]);

  const upsertExpenseLocal = (nextExpense) => {
    const next = [nextExpense, ...expenses.filter((item) => Number(item.id) !== Number(nextExpense.id))];
    setExpenses(next);
    setCachedExpenses(selectedSetId, next, scope);
  };

  const removeExpenseLocal = (expenseId) => {
    const next = expenses.filter((item) => Number(item.id) !== Number(expenseId));
    setExpenses(next);
    setCachedExpenses(selectedSetId, next, scope);
  };

  const openConfirmModal = ({ type, payload, title, description, confirmLabel = 'Confirmar' }) => {
    setConfirmModal({
      open: true,
      type,
      payload,
      title,
      description,
      confirmLabel,
      deleteExpenses: false,
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      open: false,
      type: '',
      payload: null,
      title: '',
      description: '',
      confirmLabel: 'Confirmar',
      deleteExpenses: false,
    });
  };

  const removeExpenseLocalByUser = (groupUserId) => {
    const next = expenses.filter((expense) => Number(expense.user_id) !== Number(groupUserId));
    setExpenses(next);
    setCachedExpenses(selectedSetId, next, scope);
  };

  const createGroup = async () => {
    const setName = String(groupNameForm || '').trim();
    if (!setName) {
      setError('Nombre de grupo requerido.');
      return;
    }

    if (!isOnline) {
      const tempId = createTempId();
      commitGroups([{ id: tempId, name: setName, role: 1, pending_sync: true }, ...groups]);
      setSelectedSetId(tempId);
      queueAction({ type: 'set.create', payload: { tempId, set_name: setName } });
      setGroupNameForm('');
      setMessage('Grupo encolado offline.');
      return;
    }

    await setsApi.create({ set_name: setName });
    setGroupNameForm('');
    await loadGroups();
    setMessage('Grupo creado.');
  };

  const openGroupEditModal = (group) => {
    if (Number(group?.role) !== 1) {
      setError('Solo administradores pueden modificar el grupo.');
      return;
    }
    setGroupActionModal({
      open: true,
      mode: 'edit',
      step: 1,
      groupId: Number(group.id),
      groupName: group.name || '',
      newName: group.name || '',
      confirmWord: '',
    });
  };

  const openGroupDeleteModal = (group) => {
    if (Number(group?.role) !== 1) {
      setError('Solo administradores pueden eliminar grupos.');
      return;
    }
    setGroupActionModal({
      open: true,
      mode: 'delete',
      step: 1,
      groupId: Number(group.id),
      groupName: group.name || '',
      newName: '',
      confirmWord: '',
    });
  };

  const closeGroupActionModal = () => {
    setGroupActionModal({
      open: false,
      mode: '',
      step: 1,
      groupId: null,
      groupName: '',
      newName: '',
      confirmWord: '',
    });
  };

  const goGroupActionStep = (nextStep) => {
    setGroupActionModal((prev) => ({
      ...prev,
      step: nextStep,
      confirmWord: '',
    }));
  };

  const confirmGroupAction = async () => {
    const mode = groupActionModal.mode;
    const setId = Number(groupActionModal.groupId);
    if (!setId || !mode) return;

    if (mode === 'edit') {
      const setName = String(groupActionModal.newName || '').trim();
      const confirmWord = String(groupActionModal.confirmWord || '').trim().toLowerCase();
      if (!setName) {
        setError('Nombre de grupo requerido.');
        return;
      }
      if (confirmWord !== 'editar') {
        setError("Para editar debes escribir 'editar'.");
        return;
      }
      commitGroups(
        groups.map((group) =>
          Number(group.id) === setId ? { ...group, name: setName, pending_sync: !isOnline } : group
        )
      );
      closeGroupActionModal();
      if (!isOnline) {
        queueAction({ type: 'set.update', payload: { setId, set_name: setName } });
        setMessage('Edicion de grupo encolada offline.');
        return;
      }
      await setsApi.update(setId, { set_name: setName });
      setMessage('Grupo editado.');
      return;
    }

    if (mode === 'delete') {
      const confirmWord = String(groupActionModal.confirmWord || '').trim().toLowerCase();
      if (confirmWord !== 'eliminar') {
        setError("Para eliminar debes escribir 'eliminar'.");
        return;
      }
      const nextGroups = groups.filter((group) => Number(group.id) !== setId);
      commitGroups(nextGroups);
      setSelectedSetId(nextGroups.length > 0 ? Number(nextGroups[0].id) : null);
      closeGroupActionModal();
      if (!isOnline) {
        queueAction({ type: 'set.delete', payload: { setId } });
        setMessage('Eliminacion de grupo encolada offline.');
        return;
      }
      await setsApi.delete(setId);
      setMessage('Grupo eliminado.');
    }
  };

  const startCategoryEdit = (category) => {
    setCategoryForm({
      editingId: Number(category.id),
      name: category.name || '',
      expense_type: String(category.expense_type || '1'),
    });
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      editingId: null,
      name: '',
      expense_type: '1',
    });
  };

  const saveCategory = async () => {
    if (!selectedSetId || !isAdmin) {
      setError('Solo administradores pueden gestionar categorias/proveedores.');
      return;
    }
    const categoryName = String(categoryForm.name || '').trim();
    const typeId = Number(categoryForm.expense_type);
    if (!categoryName) {
      setError('Nombre requerido.');
      return;
    }
    if (![1, 2, 3].includes(typeId)) {
      setError('Tipo invalido.');
      return;
    }

    if (!categoryForm.editingId) {
      const tempCategoryId = createTempId();
      const optimistic = { id: tempCategoryId, name: categoryName, expense_type: typeId, pending_sync: !isOnline };
      const nextCategories = [...categories, optimistic];
      setCategories(nextCategories);
      setCachedCategories(selectedSetId, undefined, nextCategories, scope);

      if (!isOnline) {
        queueAction({
          type: 'category.create',
          payload: {
            setId: Number(selectedSetId),
            tempCategoryId,
            category_name: categoryName,
            expense_type: typeId,
          },
        });
        resetCategoryForm();
        setMessage('Categoria/proveedor encolado offline.');
        return;
      }

      const data = await categoriesApi.create(selectedSetId, {
        category_name: categoryName,
        expense_type: typeId,
      });
      const createdId = Number(data?.category_id);
      const patched = nextCategories.map((item) =>
        Number(item.id) === tempCategoryId ? { ...item, id: createdId, pending_sync: false } : item
      );
      setCategories(patched);
      setCachedCategories(selectedSetId, undefined, patched, scope);
      resetCategoryForm();
      setMessage('Categoria/proveedor creado.');
      return;
    }

    const categoryId = Number(categoryForm.editingId);
    const next = categories.map((item) =>
      Number(item.id) === categoryId
        ? { ...item, name: categoryName, expense_type: typeId, pending_sync: !isOnline }
        : item
    );
    setCategories(next);
    setCachedCategories(selectedSetId, undefined, next, scope);
    if (!isOnline) {
      queueAction({
        type: 'category.update',
        payload: { categoryId, category_name: categoryName, expense_type: typeId },
      });
      resetCategoryForm();
      setMessage('Edicion encolada offline.');
      return;
    }
    await categoriesApi.update(categoryId, { category_name: categoryName, expense_type: typeId });
    resetCategoryForm();
    setMessage('Categoria/proveedor editado.');
  };

  const requestDeleteCategory = (category) => {
    if (!isAdmin) {
      setError('Solo administradores pueden eliminar categorias/proveedores.');
      return;
    }
    openConfirmModal({
      type: 'delete-category',
      payload: { categoryId: Number(category.id), categoryName: category.name },
      title: 'Eliminar categoria/proveedor',
      description: `Se eliminara "${category.name}".`,
      confirmLabel: 'Eliminar',
    });
  };

  const openCreateExpenseModal = () => {
    setEditingExpenseId(null);
    setExpenseForm({
      ...defaultExpenseForm,
      user_id: user?.id ? String(user.id) : '',
    });
    setExpenseModalOpen(true);
  };

  const handleExpenseTypeChange = (nextTypeValue) => {
    const nextType = Number(nextTypeValue);
    setExpenseForm((prev) => {
      const validCategories = categories.filter(
        (category) => Number(category.expense_type) === nextType
      );
      const keepCurrentCategory = validCategories.some(
        (category) => String(category.id) === String(prev.category_id)
      );
      return {
        ...prev,
        expense_type: String(nextTypeValue),
        category_id: keepCurrentCategory
          ? prev.category_id
          : validCategories[0]
            ? String(validCategories[0].id)
            : '',
      };
    });
  };

  const startExpenseEdit = (expense) => {
    setEditingExpenseId(Number(expense.id));
    setExpenseForm({
      expense_type: String(expense.expense_type || '1'),
      category_id: String(expense.category_id || ''),
      amount: String(expense.amount || ''),
      payment_method: String(expense.payment_method || '1'),
      user_id: String(expense.user_id || ''),
      expense_date: formatDateOnly(expense.expense_date),
      description: expense.description || '',
    });
    setExpenseModalOpen(true);
  };

  const resetExpenseForm = () => {
    setEditingExpenseId(null);
    setExpenseForm(defaultExpenseForm);
    setExpenseModalOpen(false);
  };

  const saveExpense = async () => {
    if (!selectedSetId) return;
    const amount = Number(expenseForm.amount);
    const paymentMethod = Number(expenseForm.payment_method);
    const expenseDate = String(expenseForm.expense_date || '').trim();
    const description = String(expenseForm.description || '').trim() || null;

    if (!Number.isInteger(amount) || amount <= 0) {
      setError('Monto invalido.');
      return;
    }
    if (![1, 2, 3].includes(paymentMethod)) {
      setError('Forma de pago invalida.');
      return;
    }
    if (!expenseDate) {
      setError('Fecha requerida.');
      return;
    }

    if (!editingExpenseId) {
      const categoryId = Number(expenseForm.category_id);
      const userId = Number(expenseForm.user_id || user?.id);
      if (!Number.isInteger(categoryId) || categoryId <= 0) {
        setError('Categoria/proveedor requerido.');
        return;
      }
      if (!Number.isInteger(userId) || userId <= 0) {
        setError('Usuario invalido.');
        return;
      }

      const payload = {
        category_id: categoryId,
        user_id: userId,
        amount,
        payment_method: paymentMethod,
        description,
        expense_date: expenseDate,
      };

      const category = categories.find((item) => Number(item.id) === categoryId);
      const creator = users.find((item) => Number(item.id) === Number(userId));
      const tempExpenseId = createTempId();
      upsertExpenseLocal({
        id: tempExpenseId,
        ...payload,
        expense_type: Number(category?.expense_type || 1),
        category_name: category?.name || 'Categoria',
        user_email: creator?.email || user?.email || '',
        pending_sync: !isOnline,
      });

      if (!isOnline) {
        queueExpense({ setId: Number(selectedSetId), payload, tempExpenseId });
        resetExpenseForm();
        setMessage('Gasto encolado offline.');
        return;
      }

      const data = await expensesApi.create(selectedSetId, payload);
      upsertExpenseLocal({
        ...payload,
        id: Number(data?.id),
        expense_type: Number(category?.expense_type || 1),
        category_name: category?.name || 'Categoria',
        user_email: creator?.email || user?.email || '',
        pending_sync: false,
      });
      resetExpenseForm();
      setMessage('Gasto creado.');
      return;
    }

    const expenseId = Number(editingExpenseId);
    const existingExpense = expenses.find((item) => Number(item.id) === expenseId);
    if (!existingExpense) {
      setError('No se encontro el gasto a editar.');
      return;
    }

    const patchPayload = {
      amount,
      payment_method: paymentMethod,
      expense_date: expenseDate,
      description,
    };

    const category = categories.find((item) => Number(item.id) === Number(existingExpense.category_id));
    const creator = users.find((item) => Number(item.id) === Number(existingExpense.user_id));

    upsertExpenseLocal({
      ...existingExpense,
      ...patchPayload,
      id: expenseId,
      expense_type: Number(category?.expense_type || 1),
      category_name: category?.name || 'Categoria',
      user_email: creator?.email || user?.email || '',
      pending_sync: !isOnline,
    });
    if (!isOnline) {
      queueAction({ type: 'expense.update', payload: { expenseId, payload: patchPayload } });
      resetExpenseForm();
      setMessage('Edicion de gasto encolada offline.');
      return;
    }
    await expensesApi.update(expenseId, patchPayload);
    resetExpenseForm();
    setMessage('Gasto editado.');
  };

  const requestDeleteExpense = (expense) => {
    openConfirmModal({
      type: 'delete-expense',
      payload: { expenseId: Number(expense.id), categoryName: expense.category_name, amount: expense.amount },
      title: 'Eliminar gasto',
      description: `Se eliminara "${expense.category_name}" por $${expense.amount}.`,
      confirmLabel: 'Eliminar',
    });
  };

  const requestRemoveUser = (groupUser) => {
    if (!selectedSetId || !isAdmin || Number(groupUser.id) === Number(user?.id) || Number(groupUser.role) === 1) {
      return;
    }
    setConfirmModal({
      open: true,
      type: 'remove-user',
      payload: { groupUser },
      title: 'Quitar usuario del grupo',
      description: `Vas a quitar a ${groupUser.email} del grupo.`,
      confirmLabel: 'Quitar',
      deleteExpenses: false,
    });
  };

  const confirmModalAction = async () => {
    const action = { ...confirmModal };
    closeConfirmModal();

    if (action.type === 'delete-category') {
      const categoryId = Number(action.payload?.categoryId);
      const next = categories.filter((item) => Number(item.id) !== categoryId);
      setCategories(next);
      setCachedCategories(selectedSetId, undefined, next, scope);
      if (!isOnline) {
        queueAction({ type: 'category.delete', payload: { categoryId } });
        setMessage('Eliminacion encolada offline.');
        return;
      }
      await categoriesApi.delete(categoryId);
      setMessage('Categoria/proveedor eliminado.');
      return;
    }

    if (action.type === 'delete-expense') {
      const expenseId = Number(action.payload?.expenseId);
      removeExpenseLocal(expenseId);
      if (!isOnline) {
        queueAction({ type: 'expense.delete', payload: { expenseId } });
        setMessage('Eliminacion de gasto encolada offline.');
        return;
      }
      await expensesApi.delete(expenseId);
      setMessage('Gasto eliminado.');
      return;
    }

    if (action.type === 'remove-user') {
      const groupUser = action.payload?.groupUser;
      if (!groupUser) return;
      const deleteExpenses = Boolean(action.deleteExpenses);
      const nextUsers = users.filter((item) => Number(item.id) !== Number(groupUser.id));
      setUsers(nextUsers);
      setCachedSetUsers(selectedSetId, nextUsers, scope);
      if (deleteExpenses) removeExpenseLocalByUser(groupUser.id);
      if (!isOnline) {
        queueAction({
          type: 'set.user.remove',
          payload: {
            setId: Number(selectedSetId),
            userId: Number(groupUser.id),
            deleteExpenses,
          },
        });
        setMessage('Quitar usuario encolado offline.');
        return;
      }
      await setsApi.removeUser(selectedSetId, groupUser.id, { delete_expenses: deleteExpenses });
      setMessage('Usuario removido.');
    }
  };

  const onAction = async (fn) => {
    try {
      setError('');
      setMessage('');
      await fn();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Operacion fallida');
    }
  };

  const updateExpensesScrollProgress = useCallback(() => {
    const node = expensesScrollRef.current;
    if (!node) {
      setExpensesScrollProgress(0);
      return;
    }
    const maxScroll = node.scrollHeight - node.clientHeight;
    if (maxScroll <= 0) {
      setExpensesScrollProgress(0);
      return;
    }
    const nextProgress = Math.min(1, Math.max(0, node.scrollTop / maxScroll));
    setExpensesScrollProgress(nextProgress);
  }, []);

  const openFiltersModal = () => {
    setFiltersDraft(filters);
    setCategoryFilterPaneIndex(0);
    setFiltersModalOpen(true);
  };

  const closeFiltersModal = () => {
    setFiltersModalOpen(false);
  };

  const applyFilters = () => {
    if (
      filtersDraft.from_date
      && filtersDraft.to_date
      && filtersDraft.from_date > filtersDraft.to_date
    ) {
      setError('Rango de fechas invalido.');
      return;
    }
    setFilters(filtersDraft);
    setFiltersModalOpen(false);
  };

  const clearFilters = () => {
    setFiltersDraft(defaultFilters);
    setCategoryFilterPaneIndex(0);
  };

  const toggleDraftExpenseTypes = (nextExpenseTypeIds) => {
    setFiltersDraft((prev) => {
      const allowedCategoryIds = categories
        .filter(
          (category) =>
            nextExpenseTypeIds.length === 0
            || nextExpenseTypeIds.includes(String(category.expense_type))
        )
        .map((category) => String(category.id));

      return {
        ...prev,
        expense_type_ids: nextExpenseTypeIds,
        category_ids: prev.category_ids.filter((categoryId) =>
          allowedCategoryIds.includes(String(categoryId))
        ),
      };
    });
    setCategoryFilterPaneIndex(0);
  };

  const toggleDraftCategory = (categoryId) => {
    setFiltersDraft((prev) => ({
      ...prev,
      category_ids: toggleListValue(prev.category_ids, categoryId),
    }));
  };

  const toggleGroupFavorite = (groupId) => {
    const targetGroupId = Number(groupId);
    if (!Number.isInteger(targetGroupId)) return;
    const next = toggleFavoriteGroup(targetGroupId, scope);
    setFavoriteGroupId(next);
  };

  useEffect(() => {
    if (tab !== TAB.EXPENSES) return;
    const raf = requestAnimationFrame(updateExpensesScrollProgress);
    return () => cancelAnimationFrame(raf);
  }, [tab, filteredExpenses.length, updateExpensesScrollProgress]);

  return (
    <main className="hidden h-[100dvh] overflow-hidden bg-app-bg text-app-ink lg:flex">
      <aside className="w-64 border-r border-app-ink/10 bg-app-panel/70 p-4">
        <div className="mb-4">
          <h1 className="font-heading text-lg font-bold uppercase">Grupos</h1>
          <div className="mt-3 flex items-center gap-2">
            <input
              className="app-input"
              placeholder="Nuevo grupo"
              value={groupNameForm}
              onChange={(event) => setGroupNameForm(event.target.value)}
            />
            <button
              type="button"
              onClick={() => onAction(createGroup)}
              className="rounded-lg bg-app-mint px-3 py-2 text-xs font-extrabold uppercase"
            >
              Crear
            </button>
          </div>
        </div>
        <div className="no-scrollbar h-[calc(100vh-9rem)] overflow-y-auto space-y-2">
          {sortedGroups.map((group) => {
            const canManageGroup = Number(group.role) === 1;
            const isFavorite = Number(group.id) === Number(favoriteGroupId);
            const isSelected = Number(group.id) === Number(selectedSetId);
            return (
              <div key={group.id} ref={setAnimatedGroupRef(group.id)} className="group relative">
                <button
                  type="button"
                  onClick={() => setSelectedSetId(Number(group.id))}
                  className={`w-full rounded-xl px-3 py-3 pr-14 text-left ${isFavorite ? 'bg-indigo-900 text-app-ink' : isSelected ? 'bg-app-mint text-app-ink' : 'bg-app-panel text-app-muted'}`}
                >
                  <p className="font-heading text-base font-bold uppercase">{group.name}</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide">
                    {Number(group.role) === 1 ? 'Admin' : 'Participante'}
                  </p>
                </button>
                <div className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 flex-col gap-1 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      title={isFavorite ? `Quitar favorito de ${group.name}` : `Marcar favorito ${group.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleGroupFavorite(group.id);
                      }}
                      className="flex h-7 w-7 items-center justify-center p-1.5 transition hover:opacity-80"
                    >
                      <MonoIcon
                        src={isFavorite ? starFullIcon : starEmptyIcon}
                        colorVar={isFavorite ? '--app-icon-star-full' : '--app-icon-star-empty'}
                        className="h-4 w-4"
                      />
                    </button>
                    {canManageGroup ? (
                      <button
                        type="button"
                        title={`Eliminar ${group.name}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onAction(async () => openGroupDeleteModal(group));
                        }}
                        className="flex h-7 w-7 items-center justify-center p-1.5 transition hover:opacity-80"
                      >
                        <MonoIcon src={closeLineIcon} colorVar="--app-icon-offline" className="h-3 w-3" />
                      </button>
                    ) : null}
                  </div>
                  {canManageGroup ? (
                    <button
                      type="button"
                      title={`Editar ${group.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onAction(async () => openGroupEditModal(group));
                      }}
                      className="ml-auto flex h-7 w-7 items-center justify-center p-1.5 transition hover:opacity-80"
                    >
                      <MonoIcon src={pencilIcon} colorVar="--app-icon-action" className="h-3 w-3" />
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      <section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <header className="border-b border-app-ink/10 bg-app-panel/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-5">
              <div>
              <p
                className={`text-xs font-semibold uppercase tracking-[0.2em] ${isSelectedGroupFavorite ? 'text-[rgb(var(--app-icon-star-full))]' : 'text-app-muted'}`}
              >
                Grupo activo
              </p>
              <h2 className="font-heading text-xl font-bold uppercase">{selectedGroup?.name || 'Sin grupo seleccionado'}</h2>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wide">
                <MonoIcon src={isOnline ? connectionIcon : offlineIcon} colorVar={isOnline ? '--app-icon-connection' : '--app-icon-offline'} className="h-7 w-7" />
                {isOnline ? 'Online' : 'Offline'}
              </div>
              {pendingCount > 0 ? <div className="flex items-center gap-1 text-xs font-bold uppercase"><MonoIcon src={pendingIcon} colorVar="--app-icon-pending" className="h-4 w-4" />{pendingCount} pendientes</div> : null}
              <button type="button" onClick={() => navigate('/profile')} className="rounded-lg bg-app-panel px-3 py-2 text-xs font-bold uppercase">{getEmailAlias(user?.email)}</button>
              <button type="button" onClick={async () => { await logout(); navigate('/auth', { replace: true }); }} className="rounded-lg bg-app-mint px-3 py-2 text-xs font-bold uppercase">Logout</button>
            </div>
          </div>
        </header>

        <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-6">
          <div className="grid grid-cols-4 gap-3">
            <article className="rounded-xl bg-app-panel/70 p-3"><p className="text-xs uppercase text-app-muted">Total filtrado</p><p className="mt-1 font-heading text-xl font-bold">${totalAmount.toLocaleString('es-AR')}</p></article>
            <article className="rounded-xl bg-app-panel/70 p-3"><p className="text-xs uppercase text-app-muted">Gastos</p><p className="mt-1 font-heading text-xl font-bold">{filteredExpenses.length}</p></article>
            <article className="rounded-xl bg-app-panel/70 p-3"><p className="text-xs uppercase text-app-muted">Categorias</p><p className="mt-1 font-heading text-xl font-bold">{categories.length}</p></article>
            <article className="rounded-xl bg-app-panel/70 p-3"><p className="text-xs uppercase text-app-muted">Usuarios</p><p className="mt-1 font-heading text-xl font-bold">{users.length}</p></article>
          </div>

          <article className="flex h-[calc(100dvh-13rem)] min-h-[26rem] shrink-0 flex-col overflow-hidden rounded-2xl bg-app-panel/70 p-4">
            <div className="mb-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTab(TAB.EXPENSES)}
                className={`rounded-lg px-3 py-2 text-xs font-extrabold uppercase ${tab === TAB.EXPENSES ? 'bg-app-mint text-app-ink' : 'bg-app-panel text-app-muted'}`}
              >
                Gastos
              </button>
              <button
                type="button"
                onClick={() => setTab(TAB.CATEGORIES)}
                className={`rounded-lg px-3 py-2 text-xs font-extrabold uppercase ${tab === TAB.CATEGORIES ? 'bg-app-mint text-app-ink' : 'bg-app-panel text-app-muted'}`}
              >
                Categorias
              </button>
              <button
                type="button"
                onClick={() => setTab(TAB.USERS)}
                className={`rounded-lg px-3 py-2 text-xs font-extrabold uppercase ${tab === TAB.USERS ? 'bg-app-mint text-app-ink' : 'bg-app-panel text-app-muted'}`}
              >
                Usuarios
              </button>
              {tab === TAB.EXPENSES ? (
                <button
                  type="button"
                  onClick={() => setExpandedExpenseIds([])}
                  disabled={expandedExpenseIds.length === 0}
                  className="rounded-lg bg-app-panel px-3 py-2 text-xs font-extrabold uppercase text-app-muted disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Cerrar descripciones
                </button>
              ) : null}
              {tab === TAB.EXPENSES ? (
                <div className="ml-auto flex items-center gap-5">
                  <div
                    className="relative h-3.5 w-32 overflow-hidden rounded-full bg-app-ink/20"
                    aria-hidden="true"
                  >
                    <div
                      className="absolute left-0 top-0 h-full bg-app-ink transition-[width] duration-150"
                      style={{ width: `${Math.round(expensesScrollProgress * 100)}%` }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={openFiltersModal}
                    className="rounded-lg bg-app-ink px-3 py-2 text-xs font-extrabold uppercase text-app-bg"
                  >
                    Filtros{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
                  </button>
                </div>
              ) : null}
            </div>

            {tab === TAB.EXPENSES ? (
              <div className="min-h-0 flex flex-1 flex-col overflow-hidden">
                <table className="w-full min-w-[980px] table-fixed text-left">
                  <colgroup>
                    <col className="w-[15%]" />
                    <col className="w-[15%]" />
                    <col className="w-[13%]" />
                    <col className="w-[13%]" />
                    <col className="w-[13%]" />
                    <col className="w-[11%]" />
                    <col className="w-[20%]" />
                  </colgroup>
                  <thead className="text-[11px] font-extrabold uppercase tracking-wide text-app-muted">
                    <tr>
                      <th className="px-2 py-2">
                        <button
                          type="button"
                          onClick={() => toggleExpenseSort('category')}
                          className="flex items-center gap-1 uppercase"
                        >
                          Categoria
                          <span className="w-3 text-left">{getSortIndicator('category')}</span>
                        </button>
                      </th>
                      <th className="px-2 py-2">
                        <button
                          type="button"
                          onClick={() => toggleExpenseSort('amount')}
                          className="flex items-center gap-1 uppercase"
                        >
                          Monto
                          <span className="w-3 text-left">{getSortIndicator('amount')}</span>
                        </button>
                      </th>
                      <th className="px-2 py-2">
                        <button
                          type="button"
                          onClick={() => toggleExpenseSort('type')}
                          className="flex items-center gap-1 uppercase"
                        >
                          Tipo
                          <span className="w-3 text-left">{getSortIndicator('type')}</span>
                        </button>
                      </th>
                      <th className="px-2 py-2">
                        <button
                          type="button"
                          onClick={() => toggleExpenseSort('payment')}
                          className="flex items-center gap-1 uppercase"
                        >
                          Pago
                          <span className="w-3 text-left">{getSortIndicator('payment')}</span>
                        </button>
                      </th>
                      <th className="px-2 py-2">
                        <button
                          type="button"
                          onClick={() => toggleExpenseSort('user')}
                          className="flex items-center gap-1 uppercase"
                        >
                          Usuario
                          <span className="w-3 text-left">{getSortIndicator('user')}</span>
                        </button>
                      </th>
                      <th className="px-2 py-2">
                        <button
                          type="button"
                          onClick={() => toggleExpenseSort('date')}
                          className="flex items-center gap-1 uppercase"
                        >
                          Fecha
                          <span className="w-3 text-left">{getSortIndicator('date')}</span>
                        </button>
                      </th>
                      <th className="px-2 py-2">Acciones</th>
                    </tr>
                  </thead>
                </table>
                <div
                  ref={expensesScrollRef}
                  onScroll={updateExpensesScrollProgress}
                  className="no-scrollbar min-h-0 flex-1 overflow-auto"
                >
                  <table className="w-full min-w-[980px] table-fixed text-left">
                    <colgroup>
                      <col className="w-[15%]" />
                      <col className="w-[15%]" />
                      <col className="w-[13%]" />
                      <col className="w-[13%]" />
                      <col className="w-[13%]" />
                      <col className="w-[11%]" />
                      <col className="w-[20%]" />
                    </colgroup>
                    <tbody>
                      {sortedFilteredExpenses.map((expense) => {
                        const expenseId = Number(expense.id);
                        const isExpanded = expandedExpenseIds.includes(expenseId);
                        return (
                          <Fragment key={expense.id}>
                            <tr
                              className="cursor-pointer border-t border-app-ink/10 text-base hover:bg-app-bg/25"
                              onClick={() =>
                                setExpandedExpenseIds((prev) =>
                                  prev.includes(expenseId)
                                    ? prev.filter((value) => value !== expenseId)
                                    : [...prev, expenseId]
                                )
                              }
                            >
                              <td className="px-2 py-2 font-semibold">{expense.category_name}</td>
                              <td className="px-2 py-2 font-extrabold">${Number(expense.amount || 0).toLocaleString('es-AR')}</td>
                              <td className="px-2 py-2">{getExpenseTypeById(expense.expense_type)?.label || '-'}</td>
                              <td className="px-2 py-2">{getPaymentMethodById(expense.payment_method)?.label || '-'}</td>
                              <td className="px-2 py-2">{getEmailAlias(expense.user_email)}</td>
                              <td className="px-2 py-2">{formatDateOnly(expense.expense_date)}</td>
                              <td className="px-2 py-2">
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    title="Editar gasto"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      startExpenseEdit(expense);
                                    }}
                                    className="flex h-7 w-7 items-center justify-center p-1.5 transition hover:opacity-80"
                                  >
                                    <MonoIcon src={pencilIcon} colorVar="--app-icon-action" className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    title="Eliminar gasto"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      requestDeleteExpense(expense);
                                    }}
                                    className="flex h-7 w-7 items-center justify-center p-1.5 transition hover:opacity-80"
                                  >
                                    <MonoIcon src={closeLineIcon} colorVar="--app-icon-offline" className="h-3 w-3" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            <tr className={isExpanded ? 'border-t border-app-ink/10 bg-app-bg/35' : ''}>
                              <td colSpan={7} className="px-0 py-0">
                                <div
                                  className={`overflow-hidden transition-all duration-300 ease-out ${isExpanded ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
                                    }`}
                                >
                                  <div className="px-4 py-2 text-base text-app-muted">
                                    {expense.description ? expense.description : 'Sin descripcion.'}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {tab === TAB.CATEGORIES ? (
              <div className="no-scrollbar min-h-0 flex-1 overflow-auto">
                <div className="mb-3 grid grid-cols-4 gap-2">
                  <input
                    className="app-input"
                    placeholder="Nombre categoria/proveedor"
                    value={categoryForm.name}
                    onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))}
                  />
                  <select
                    className="app-select"
                    value={categoryForm.expense_type}
                    onChange={(event) => setCategoryForm((prev) => ({ ...prev, expense_type: event.target.value }))}
                  >
                    <option value="1">Fijo</option>
                    <option value="2">Variable</option>
                    <option value="3">Proveedor</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => onAction(saveCategory)}
                    className="rounded-lg bg-app-mint px-3 py-2 text-xs font-extrabold uppercase"
                  >
                    {categoryForm.editingId ? 'Guardar' : 'Crear'}
                  </button>
                  {categoryForm.editingId ? (
                    <button
                      type="button"
                      onClick={resetCategoryForm}
                      className="rounded-lg bg-app-panel px-3 py-2 text-xs font-bold uppercase"
                    >
                      Cancelar
                    </button>
                  ) : <div />}
                </div>
                <table className="w-full min-w-[760px] text-left">
                  <thead className="text-[11px] font-extrabold uppercase tracking-wide text-app-muted"><tr><th className="px-2 py-2">Nombre</th><th className="px-2 py-2">Tipo</th><th className="px-2 py-2">Acciones</th></tr></thead>
                  <tbody>{categories.map((category) => <tr key={category.id} className="border-t border-app-ink/10 text-base"><td className="px-2 py-2 font-semibold">{category.name}</td><td className="px-2 py-2">{getExpenseTypeById(category.expense_type)?.label || '-'}</td><td className="px-2 py-2"><div className="flex items-center gap-2"><button type="button" onClick={() => startCategoryEdit(category)} className="rounded-md bg-app-panel px-2 py-1 text-[11px] font-bold uppercase">Editar</button><button type="button" onClick={() => requestDeleteCategory(category)} className="rounded-md bg-app-error-bg px-2 py-1 text-[11px] font-bold uppercase text-app-error-text">Eliminar</button></div></td></tr>)}</tbody>
                </table>
              </div>
            ) : null}

            {tab === TAB.USERS ? (
              <div className="no-scrollbar min-h-0 flex-1 overflow-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead className="text-[11px] font-extrabold uppercase tracking-wide text-app-muted"><tr><th className="px-2 py-2">Usuario</th><th className="px-2 py-2">Rol</th><th className="px-2 py-2">Acciones</th></tr></thead>
                  <tbody>{users.map((groupUser) => <tr key={groupUser.id} className="border-t border-app-ink/10 text-base"><td className="px-2 py-2 font-semibold">{groupUser.email}</td><td className="px-2 py-2">{Number(groupUser.role) === 1 ? 'Admin' : 'Participante'}</td><td className="px-2 py-2"><button type="button" onClick={() => requestRemoveUser(groupUser)} disabled={!isAdmin || Number(groupUser.role) === 1 || Number(groupUser.id) === Number(user?.id)} className="rounded-md bg-app-error-bg px-2 py-1 text-[11px] font-bold uppercase text-app-error-text disabled:cursor-not-allowed disabled:opacity-45">Quitar</button></td></tr>)}</tbody>
                </table>
              </div>
            ) : null}
          </article>

          {loading ? <p className="text-sm font-semibold text-app-muted">Cargando...</p> : null}
          {message ? <p className="rounded-lg bg-app-success-bg px-3 py-2 text-xs font-semibold text-app-success-text">{message}</p> : null}
          {error ? <p className="rounded-lg bg-app-error-bg px-3 py-2 text-xs font-semibold text-app-error-text">{error}</p> : null}
        </section>
      </section>

      {tab === TAB.EXPENSES ? (
        <button
          type="button"
          onClick={openCreateExpenseModal}
          disabled={!selectedSetId}
          className="fixed bottom-8 right-8 z-40 rounded-full bg-app-mint px-5 py-4 font-heading text-sm font-extrabold uppercase tracking-wide text-app-ink shadow-card transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
        >
          + Crear gasto
        </button>
      ) : null}

      <DesktopModal
        open={expenseModalOpen}
        onClose={resetExpenseForm}
        title={editingExpenseId ? 'Editar gasto' : 'Nuevo gasto'}
        maxWidthClass="max-w-5xl"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Tipo de gasto</span>
            <div className="mt-2">
              <WrappedChoiceGroup
                options={expenseTypeOptions}
                value={expenseForm.expense_type}
                onChange={editingExpenseId ? () => { } : handleExpenseTypeChange}
                itemMinWidth={132}
              />
            </div>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Forma de pago</span>
            <div className="mt-2">
              <WrappedChoiceGroup
                options={paymentMethodOptions}
                value={expenseForm.payment_method}
                onChange={(value) => setExpenseForm((prev) => ({ ...prev, payment_method: String(value) }))}
                itemMinWidth={132}
              />
            </div>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Quien creo el gasto</span>
            <div className="mt-2">
              <WrappedChoiceGroup
                options={creatorOptions}
                value={expenseForm.user_id}
                onChange={
                  editingExpenseId
                    ? () => { }
                    : (value) => setExpenseForm((prev) => ({ ...prev, user_id: String(value) }))
                }
                itemMinWidth={124}
              />
            </div>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">
              Categoria / Proveedor
            </span>
            <div className="mt-2">
              {categoryChoiceOptions.length > 0 ? (
                <WrappedChoiceGroup
                  options={categoryChoiceOptions}
                  value={expenseForm.category_id}
                  onChange={
                    editingExpenseId
                      ? () => { }
                      : (value) => setExpenseForm((prev) => ({ ...prev, category_id: String(value) }))
                  }
                  itemMinWidth={148}
                />
              ) : (
                <p className="rounded-lg bg-app-bg/35 px-3 py-2 text-xs font-semibold text-app-muted">
                  No hay categorias/proveedores para este tipo.
                </p>
              )}
            </div>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Monto</span>
            <input
              className="app-input mt-2"
              type="number"
              min="1"
              step="1"
              placeholder="0"
              value={expenseForm.amount}
              onChange={(event) => setExpenseForm((prev) => ({ ...prev, amount: event.target.value }))}
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Fecha</span>
            <input
              className="app-input mt-2"
              type="date"
              value={expenseForm.expense_date}
              onChange={(event) => setExpenseForm((prev) => ({ ...prev, expense_date: event.target.value }))}
            />
          </label>

          <label className="block lg:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Descripcion (opcional)</span>
            <input
              className="app-input mt-2"
              value={expenseForm.description}
              onChange={(event) => setExpenseForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Detalle del gasto"
            />
          </label>
        </div>

        {editingExpenseId ? (
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-app-muted">
            En edicion solo se actualizan monto, pago, fecha y descripcion.
          </p>
        ) : null}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={resetExpenseForm}
            className="rounded-lg bg-app-panel px-3 py-2 text-xs font-bold uppercase tracking-wide text-app-ink"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onAction(saveExpense)}
            className="rounded-lg bg-app-mint px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-app-ink"
          >
            {editingExpenseId ? 'Guardar cambios' : 'Guardar gasto'}
          </button>
        </div>
      </DesktopModal>

      <DesktopModal
        open={filtersModalOpen}
        onClose={closeFiltersModal}
        title="Filtros de gastos"
        maxWidthClass="max-w-5xl"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Tipo de gasto</span>
            <div className="mt-2">
              <WrappedMultiChoiceGroup
                options={expenseTypeOptions}
                values={filtersDraft.expense_type_ids}
                onChange={toggleDraftExpenseTypes}
                itemMinWidth={128}
              />
            </div>
          </div>

          <div className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Forma de pago</span>
            <div className="mt-2">
              <WrappedMultiChoiceGroup
                options={paymentMethodOptions}
                values={filtersDraft.payment_method_ids}
                onChange={(next) =>
                  setFiltersDraft((prev) => ({ ...prev, payment_method_ids: next }))
                }
                itemMinWidth={132}
              />
            </div>
          </div>

          <div className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">
              {getExpenseTypeById(currentCategoryFilterTypeId)?.label || 'Categorias'}
            </span>
            <div className="mt-2">
              <div className="relative overflow-hidden rounded-lg border-0 bg-transparent pr-10">
                <div className="absolute right-1 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setCategoryFilterPaneIndex((prev) => Math.max(0, prev - 1))}
                    disabled={categoryFilterPaneIndex <= 0}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-app-ink/25 bg-app-panel text-xs font-black text-app-ink disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    &#8592;
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCategoryFilterPaneIndex((prev) =>
                        Math.min(categoryFilterPanes.length - 1, prev + 1)
                      )
                    }
                    disabled={categoryFilterPaneIndex >= categoryFilterPanes.length - 1}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-app-ink/25 bg-app-panel text-xs font-black text-app-ink disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    &#8594;
                  </button>
                </div>

                <div className="overflow-hidden">
                  <div
                    className="flex w-full transition-transform duration-300 ease-out"
                    style={{ transform: `translateX(-${categoryFilterPaneIndex * 100}%)` }}
                  >
                    {categoryFilterPanes.map((pane, paneIndex) => (
                      <div
                        key={pane.typeId}
                        className={`w-full shrink-0 ${paneIndex === categoryFilterPaneIndex ? 'pointer-events-auto' : 'pointer-events-none'}`}
                        aria-hidden={paneIndex !== categoryFilterPaneIndex}
                      >
                        {pane.options.length > 0 ? (
                          <div className="grid grid-cols-3 gap-2">
                            {pane.options.map((option) => {
                              const isActive = filtersDraft.category_ids.includes(String(option.value));
                              const tone = CATEGORY_FILTER_TONES[String(pane.typeId)] || CATEGORY_FILTER_TONES['1'];
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => toggleDraftCategory(option.value)}
                                  className={`min-w-0 rounded-md px-2 py-2 text-sm font-heading uppercase tracking-wide transition ${isActive ? tone.active : tone.inactive}`}
                                >
                                  <span className="block truncate">{option.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="rounded-lg bg-app-bg/35 px-3 py-2 text-xs font-semibold text-app-muted">
                            No hay categorias/proveedores para este tipo.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Usuarios</span>
            <div className="mt-2">
              {userFilterOptions.length > 0 ? (
                <WrappedMultiChoiceGroup
                  options={userFilterOptions}
                  values={filtersDraft.user_ids}
                  onChange={(next) =>
                    setFiltersDraft((prev) => ({ ...prev, user_ids: next }))
                  }
                  itemMinWidth={120}
                />
              ) : (
                <p className="rounded-lg bg-app-bg/35 px-3 py-2 text-xs font-semibold text-app-muted">
                  Sin usuarios para filtrar.
                </p>
              )}
            </div>
          </div>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Desde</span>
            <input
              className="app-input mt-2"
              type="date"
              value={filtersDraft.from_date}
              onChange={(event) =>
                setFiltersDraft((prev) => ({ ...prev, from_date: event.target.value }))
              }
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Hasta</span>
            <input
              className="app-input mt-2"
              type="date"
              value={filtersDraft.to_date}
              onChange={(event) =>
                setFiltersDraft((prev) => ({ ...prev, to_date: event.target.value }))
              }
            />
          </label>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg bg-app-panel px-3 py-2 text-xs font-bold uppercase tracking-wide text-app-ink"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={closeFiltersModal}
            className="rounded-lg bg-app-panel px-3 py-2 text-xs font-bold uppercase tracking-wide text-app-ink"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={applyFilters}
            className="rounded-lg bg-app-mint px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-app-ink"
          >
            Aplicar filtros
          </button>
        </div>
      </DesktopModal>

      <DesktopModal
        open={groupActionModal.open}
        onClose={closeGroupActionModal}
        title={groupActionModal.mode === 'edit' ? 'Editar grupo' : 'Eliminar grupo'}
      >
        {groupActionModal.mode === 'delete' && groupActionModal.step === 1 ? (
          <>
            <p className="text-sm font-semibold text-app-muted">
              Seguro que deseas eliminar "{groupActionModal.groupName}"?
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeGroupActionModal}
                className="rounded-lg bg-app-panel px-3 py-2 text-xs font-bold uppercase tracking-wide text-app-ink"
              >
                No
              </button>
              <button
                type="button"
                onClick={() => goGroupActionStep(2)}
                className="rounded-lg bg-app-error-bg px-3 py-2 text-xs font-bold uppercase tracking-wide text-app-error-text"
              >
                Si
              </button>
            </div>
          </>
        ) : null}

        {groupActionModal.mode === 'delete' && groupActionModal.step === 2 ? (
          <>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">
                Escribe 'ELIMINAR' para confirmar
              </span>
              <input
                className="app-input mt-2"
                value={groupActionModal.confirmWord}
                onChange={(event) =>
                  setGroupActionModal((prev) => ({
                    ...prev,
                    confirmWord: event.target.value,
                  }))
                }
                placeholder="ELIMINAR"
              />
            </label>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => goGroupActionStep(1)}
                className="rounded-lg bg-app-panel px-3 py-2 text-xs font-bold uppercase tracking-wide text-app-ink"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => onAction(confirmGroupAction)}
                disabled={String(groupActionModal.confirmWord || '').trim().toLowerCase() !== 'eliminar'}
                className="rounded-lg bg-app-error-bg px-3 py-2 text-xs font-bold uppercase tracking-wide text-app-error-text disabled:cursor-not-allowed disabled:opacity-45"
              >
                Eliminar grupo
              </button>
            </div>
          </>
        ) : null}

        {groupActionModal.mode === 'edit' && groupActionModal.step === 1 ? (
          <>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Nuevo nombre</span>
              <input
                className="app-input mt-2"
                value={groupActionModal.newName}
                onChange={(event) =>
                  setGroupActionModal((prev) => ({
                    ...prev,
                    newName: event.target.value,
                  }))
                }
                placeholder="Nombre del grupo"
              />
            </label>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeGroupActionModal}
                className="rounded-lg bg-app-panel px-3 py-2 text-xs font-bold uppercase tracking-wide text-app-ink"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => goGroupActionStep(2)}
                disabled={!String(groupActionModal.newName || '').trim()}
                className="rounded-lg bg-app-mint px-3 py-2 text-xs font-bold uppercase tracking-wide text-app-ink disabled:cursor-not-allowed disabled:opacity-45"
              >
                Continuar
              </button>
            </div>
          </>
        ) : null}

        {groupActionModal.mode === 'edit' && groupActionModal.step === 2 ? (
          <>
            <p className="text-sm font-semibold text-app-muted">
              Nuevo nombre: {String(groupActionModal.newName || '').trim()}
            </p>
            <label className="mt-3 block">
              <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">
                Escribe 'EDITAR' para confirmar
              </span>
              <input
                className="app-input mt-2"
                value={groupActionModal.confirmWord}
                onChange={(event) =>
                  setGroupActionModal((prev) => ({
                    ...prev,
                    confirmWord: event.target.value,
                  }))
                }
                placeholder="EDITAR"
              />
            </label>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => goGroupActionStep(1)}
                className="rounded-lg bg-app-panel px-3 py-2 text-xs font-bold uppercase tracking-wide text-app-ink"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => onAction(confirmGroupAction)}
                disabled={
                  !String(groupActionModal.newName || '').trim()
                  || String(groupActionModal.confirmWord || '').trim().toLowerCase() !== 'editar'
                }
                className="rounded-lg bg-app-mint px-3 py-2 text-xs font-bold uppercase tracking-wide text-app-ink disabled:cursor-not-allowed disabled:opacity-45"
              >
                Editar grupo
              </button>
            </div>
          </>
        ) : null}
      </DesktopModal>

      <DesktopModal open={confirmModal.open} onClose={closeConfirmModal} title={confirmModal.title}>
        <p className="text-sm font-semibold text-app-muted">{confirmModal.description}</p>
        {confirmModal.type === 'remove-user' ? (
          <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-app-ink">
            <input
              type="checkbox"
              checked={confirmModal.deleteExpenses}
              onChange={(event) =>
                setConfirmModal((prev) => ({
                  ...prev,
                  deleteExpenses: event.target.checked,
                }))
              }
            />
            Eliminar tambien sus gastos
          </label>
        ) : null}
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={closeConfirmModal}
            className="rounded-lg bg-app-panel px-3 py-2 text-xs font-bold uppercase tracking-wide text-app-ink"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onAction(confirmModalAction)}
            className="rounded-lg bg-app-error-bg px-3 py-2 text-xs font-bold uppercase tracking-wide text-app-error-text"
          >
            {confirmModal.confirmLabel}
          </button>
        </div>
      </DesktopModal>
    </main>
  );
}
