"use client";

import Breadcrumbs from "@components/Breadcrumbs";
import Button from "@components/Button";
import Card from "@components/Card";
import { Checkbox } from "@components/Checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/Dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/DropdownMenu";
import { Input } from "@components/Input";
import { DataTable } from "@components/table/DataTable";
import DataTableHeader from "@components/table/DataTableHeader";
import DataTableRefreshButton from "@components/table/DataTableRefreshButton";
import DataTableResetFilterButton from "@components/table/DataTableResetFilterButton";
import {
  CheckboxListPicker,
  formatCheckboxChip,
} from "@components/table/filters/CheckboxListPicker";
import {
  formatRadioChip,
  RadioOption,
  RadioPicker,
} from "@components/table/filters/RadioPicker";
import {
  TableFilterChips,
  TableFilterDef,
  TableFiltersButton,
} from "@components/table/TableFilters";
import NoResults from "@components/ui/NoResults";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import useFetchApi, { useApiCall } from "@utils/api";
import {
  ChevronDown,
  DownloadCloud,
  Globe2,
  ImagePlus,
  Layers3,
  PencilLine,
  Plus,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import React, { useMemo, useState } from "react";
import { useSWRConfig } from "swr";
import { useGroups } from "@/contexts/GroupsProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useUsers } from "@/contexts/UsersProvider";
import { GroupType } from "@/interfaces/Group";
import {
  WorkbenchCategory,
  WorkbenchIconResult,
  WorkbenchResource,
} from "@/interfaces/Workbench";
import {
  buildWorkbenchResourcePathSuffix,
  cleanIDList,
  isValidWorkbenchHTTPURL,
  safeWorkbenchIconDisplayURL,
  stringListValue,
  textValue,
  workbenchAssetPath,
} from "./WorkbenchResourcesPage.helpers";

const workbenchAdminPath = "/workbench/admin/resources";
const workbenchCategoriesPath = "/workbench/admin/categories";
const maxWorkbenchIconBytes = 1024 * 1024;

export default function WorkbenchResourcesPage() {
  const { permission } = usePermissions();
  const { mutate } = useSWRConfig();
  const canRead = permission.settings.read;
  const { data: resources, isLoading, isValidating } =
    useFetchApi<WorkbenchResource[]>(workbenchAdminPath, false, true, canRead);
  const { data: categories, isLoading: isCategoriesLoading } =
    useFetchApi<WorkbenchCategory[]>(workbenchCategoriesPath, false, true, canRead);
  const resourceRequest = useApiCall<WorkbenchResource>(workbenchAdminPath);
  const categoryRequest = useApiCall<WorkbenchCategory>(workbenchCategoriesPath);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<
    WorkbenchResource | undefined
  >();
  const [deletingResource, setDeletingResource] = useState<
    WorkbenchResource | undefined
  >();
  const [deleting, setDeleting] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<
    WorkbenchCategory | undefined
  >();
  const [quickSavingID, setQuickSavingID] = useState("");
  const [quickError, setQuickError] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "sort", desc: false },
  ]);

  const canCreate = canRead && permission.settings.create;
  const canUpdate = canRead && permission.settings.update;
  const canDelete = canRead && permission.settings.delete;

  const workbenchCategories = useMemo(() => {
    const seen = new Set<string>();
    const result: WorkbenchCategory[] = [];
    for (const category of categories ?? []) {
      const name = textValue(category.name);
      if (!name || seen.has(name)) continue;
      seen.add(name);
      result.push({ ...category, name });
    }
    for (const resource of resources ?? []) {
      const name = textValue(resource.category);
      if (!name || seen.has(name)) continue;
      seen.add(name);
      result.push({ id: `resource-category-${name}`, name, sort: result.length * 10 });
    }
    return result.sort((a, b) => {
      if ((a.sort ?? 0) !== (b.sort ?? 0)) return (a.sort ?? 0) - (b.sort ?? 0);
      return a.name.localeCompare(b.name);
    });
  }, [categories, resources]);

  const openCreate = () => {
    setEditingResource(undefined);
    setEditorOpen(true);
  };

  const openEdit = (resource: WorkbenchResource) => {
    setEditingResource(resource);
    setEditorOpen(true);
  };

  const openVisibilityEdit = (resource: WorkbenchResource) => {
    setEditingResource({ ...resource, visibility: "restricted" });
    setEditorOpen(true);
  };

  const handleEditorOpenChange = (open: boolean) => {
    setEditorOpen(open);
    if (!open) {
      setEditingResource(undefined);
    }
  };

  const refresh = async () => {
    if (!canRead) return;
    await Promise.all([
      mutate(workbenchAdminPath),
      mutate(workbenchCategoriesPath),
    ]);
  };

  const saveResource = async (resource: WorkbenchResource) => {
    const pathSuffix = buildWorkbenchResourcePathSuffix(resource.id);
    if (pathSuffix ? !canUpdate : !canCreate) {
      throw new Error("当前账号没有保存工作台资源的权限。");
    }
    if (pathSuffix) {
      await resourceRequest.put(resource, pathSuffix);
    } else {
      await resourceRequest.post(resource);
    }
    setEditorOpen(false);
    setEditingResource(undefined);
    await mutate(workbenchAdminPath);
  };

  const quickUpdateResource = async (
    resource: WorkbenchResource,
    patch: Partial<WorkbenchResource>,
  ) => {
    const pathSuffix = buildWorkbenchResourcePathSuffix(resource.id);
    if (!canUpdate || !pathSuffix) return;
    setQuickSavingID(resource.id ?? "");
    setQuickError("");
    try {
      await saveResource({ ...resource, ...patch });
    } catch (err) {
      setQuickError(
        err instanceof Error ? err.message : "更新工作台资源失败。",
      );
    } finally {
      setQuickSavingID("");
    }
  };

  const saveCategory = async (category: WorkbenchCategory) => {
    const payload = {
      ...category,
      name: textValue(category.name),
      sort: Number(category.sort || 0),
    };
    if (payload.id) {
      await categoryRequest.put(payload, `/${encodeURIComponent(payload.id)}`);
    } else {
      await categoryRequest.post(payload);
    }
    setCategoryDialogOpen(false);
    setEditingCategory(undefined);
    await mutate(workbenchCategoriesPath);
  };

  const deleteResource = async (resource: WorkbenchResource) => {
    const pathSuffix = buildWorkbenchResourcePathSuffix(resource.id);
    if (!pathSuffix || !canDelete) return;
    setDeleting(true);
    try {
      await resourceRequest.del(undefined, pathSuffix);
      setDeletingResource(undefined);
      await mutate(workbenchAdminPath);
    } finally {
      setDeleting(false);
    }
  };

  const statusOptions = useMemo<RadioOption<boolean | undefined>[]>(
    () => [
      { value: undefined, label: "全部状态", dotClass: "bg-nb-gray-500" },
      { value: true, label: "已启用", dotClass: "bg-green-500" },
      { value: false, label: "已停用", dotClass: "bg-nb-gray-700" },
    ],
    [],
  );

  const visibilityOptions = useMemo<RadioOption<string | undefined>[]>(
    () => [
      { value: undefined, label: "全部范围" },
      { value: "all", label: "全部用户" },
      { value: "restricted", label: "指定范围" },
    ],
    [],
  );

  const categoryOptions = useMemo(
    () =>
      workbenchCategories.map((category) => ({
        label: category.name,
        value: category.name,
      })),
    [workbenchCategories],
  );

  const filterDefs = useMemo<TableFilterDef[]>(
    () => [
      {
        id: "enabled",
        label: "状态",
        renderPicker: (p) => (
          <RadioPicker
            value={p.value as boolean | undefined}
            onChange={p.onChange}
            close={p.close}
            options={statusOptions}
          />
        ),
        formatChip: (v) =>
          formatRadioChip(v as boolean | undefined, statusOptions),
      },
      {
        id: "visibilityKind",
        label: "可见范围",
        renderPicker: (p) => (
          <RadioPicker
            value={p.value as string | undefined}
            onChange={p.onChange}
            close={p.close}
            options={visibilityOptions}
          />
        ),
        formatChip: (v) =>
          formatRadioChip(v as string | undefined, visibilityOptions),
      },
      {
        id: "categoryName",
        label: "分类",
        renderPicker: (p) => (
          <CheckboxListPicker
            value={p.value as string[] | undefined}
            onChange={p.onChange}
            close={p.close}
            options={categoryOptions}
          />
        ),
        formatChip: (v) =>
          formatCheckboxChip(v as string[] | undefined, categoryOptions, "个分类"),
      },
    ],
    [categoryOptions, statusOptions, visibilityOptions],
  );

  const columns: ColumnDef<WorkbenchResource>[] = [
    {
      id: "search",
      accessorFn: (resource) =>
        [
          resource.name,
          resource.url,
          resource.category,
          resource.description,
          ...stringListValue(resource.tags),
        ].join(" "),
    },
    {
      id: "sort",
      accessorKey: "sort",
    },
    {
      id: "resource",
      accessorFn: (resource) => textValue(resource.name),
      header: ({ column }) => (
        <DataTableHeader column={column}>资源</DataTableHeader>
      ),
      cell: ({ row }) => <WorkbenchResourceNameCell resource={row.original} />,
    },
    {
      id: "categoryName",
      accessorFn: (resource) => textValue(resource.category),
      filterFn: "arrIncludesSomeExact",
      header: ({ column }) => (
        <DataTableHeader column={column}>分类 / 标签</DataTableHeader>
      ),
      cell: ({ row }) => <WorkbenchCategoryCell resource={row.original} />,
    },
    {
      id: "enabled",
      accessorFn: (resource) => resource.enabled !== false,
      filterFn: "exactMatch",
      header: ({ column }) => (
        <DataTableHeader column={column}>状态</DataTableHeader>
      ),
      cell: ({ row }) => (
        <WorkbenchStatusMenu
          disabled={
            !canUpdate ||
            quickSavingID === row.original.id ||
            !buildWorkbenchResourcePathSuffix(row.original.id)
          }
          resource={row.original}
          onChange={(enabled) => quickUpdateResource(row.original, { enabled })}
        />
      ),
    },
    {
      id: "visibilityKind",
      accessorFn: (resource) =>
        resource.visibility === "restricted" ? "restricted" : "all",
      filterFn: "exactMatch",
      header: ({ column }) => (
        <DataTableHeader column={column}>可见范围</DataTableHeader>
      ),
      cell: ({ row }) => (
        <WorkbenchVisibilityMenu
          disabled={
            !canUpdate ||
            quickSavingID === row.original.id ||
            !buildWorkbenchResourcePathSuffix(row.original.id)
          }
          resource={row.original}
          onSetAll={() =>
            quickUpdateResource(row.original, {
              visibility: "all",
              visibleGroups: [],
              visibleUsers: [],
            })
          }
          onEditRestricted={() => openVisibilityEdit(row.original)}
        />
      ),
    },
    {
      id: "actions",
      accessorKey: "id",
      header: "",
      cell: ({ row }) => (
        <WorkbenchResourceActionCell
          resource={row.original}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onEdit={openEdit}
          onDelete={setDeletingResource}
        />
      ),
    },
  ];

  return (
    <div className={"p-default py-6"}>
      <Breadcrumbs>
        <Breadcrumbs.Item label={"工作台"} active />
      </Breadcrumbs>

      <div className={"mt-6 flex items-start justify-between gap-6"}>
        <div>
          <h1>工作台资源</h1>
          <p className={"mt-2 max-w-2xl text-sm text-neutral-500 dark:text-nb-gray-400"}>
            管理新客户端工作台里的服务器资源和资源可见范围。个人资源由客户端用户自己维护。
          </p>
        </div>
      </div>

      {!canRead ? (
        <div
          className={
            "mt-6 rounded-lg border border-neutral-200 bg-white p-8 text-sm text-neutral-500 shadow-sm dark:border-nb-gray-800 dark:bg-nb-gray-900 dark:text-nb-gray-400"
          }
        >
          当前账号没有查看工作台资源的权限。
        </div>
      ) : (
        <div className={"mt-6"}>
          {quickError && (
            <div className={"mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300"}>
              {quickError}
            </div>
          )}

          <DataTable
            wrapperComponent={Card}
            wrapperProps={{ className: "mt-6 pb-2 w-full" }}
            sorting={sorting}
            setSorting={setSorting}
            minimal={true}
            showSearchAndFilters={true}
            inset={false}
            tableClassName={"mt-0"}
            text={"工作台资源"}
            columns={columns}
            keepStateInLocalStorage={false}
            initialPageSize={25}
            showResetFilterButton={false}
            aboveTable={(table) => (
              <TableFilterChips table={table} filters={filterDefs} />
            )}
            data={resources}
            searchPlaceholder={"搜索名称、URL、分类或标签"}
            isLoading={isLoading || isCategoriesLoading}
            getStartedCard={
              <NoResults
                className={"py-8"}
                title={"暂无工作台资源"}
                description={"新增服务器资源后，新客户端会按可见范围展示。"}
                icon={
                  <Layers3
                    size={20}
                    className={"text-neutral-500 dark:text-nb-gray-400"}
                  />
                }
              />
            }
            columnVisibility={{
              search: false,
              sort: false,
            }}
            paginationPaddingClassName={"px-0 pt-8"}
            rightSide={() => (
              <div className={"ml-auto mr-4 flex items-center gap-2"}>
                <DataTableRefreshButton
                  onClick={refresh}
                  isDisabled={!canRead || isLoading || isValidating || isCategoriesLoading}
                />
                <Button
                  variant={"secondary"}
                  onClick={() => {
                    setEditingCategory(undefined);
                    setCategoryDialogOpen(true);
                  }}
                  disabled={!canRead || !canCreate}
                >
                  <Plus size={16} />
                  新增分类
                </Button>
                <Button
                  variant={"primary"}
                  onClick={() => openCreate()}
                  disabled={!canRead || !canCreate}
                >
                  <Plus size={16} />
                  新增资源
                </Button>
              </div>
            )}
          >
            {(table) => (
              <>
                <TableFiltersButton
                  table={table}
                  filters={filterDefs}
                  disabled={!resources || resources.length === 0}
                />
                <DataTableResetFilterButton
                  table={table}
                  onClick={() => {
                    table.setPageIndex(0);
                    table.resetColumnFilters();
                    table.resetGlobalFilter();
                  }}
                />
              </>
            )}
          </DataTable>
        </div>
      )}

      <WorkbenchResourceDialog
        open={editorOpen}
        canSave={buildWorkbenchResourcePathSuffix(editingResource?.id) ? canUpdate : canCreate}
        resource={editingResource}
        categories={workbenchCategories}
        onOpenChange={handleEditorOpenChange}
        onSave={saveResource}
      />
      <WorkbenchCategoryDialog
        open={categoryDialogOpen}
        category={editingCategory}
        canSave={editingCategory?.id ? canUpdate : canCreate}
        onCancel={() => {
          setCategoryDialogOpen(false);
          setEditingCategory(undefined);
        }}
        onSave={saveCategory}
      />
      <DeleteWorkbenchResourceDialog
        deleting={deleting}
        resource={deletingResource}
        onCancel={() => setDeletingResource(undefined)}
        onConfirm={deleteResource}
      />
    </div>
  );
}

function DeleteWorkbenchResourceDialog({
  deleting,
  resource,
  onCancel,
  onConfirm,
}: {
  deleting: boolean;
  resource?: WorkbenchResource;
  onCancel: () => void;
  onConfirm: (resource: WorkbenchResource) => void;
}) {
  return (
    <Dialog open={!!resource} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className={"max-w-md"}>
        <DialogHeader>
          <DialogTitle>删除工作台资源</DialogTitle>
          <DialogDescription>
            删除后，该服务器资源会从有权限用户的新客户端工作台中移除。
          </DialogDescription>
        </DialogHeader>
        {resource && (
          <div className={"rounded-md bg-neutral-50 px-3 py-2 text-sm text-neutral-700 dark:bg-nb-gray-950 dark:text-nb-gray-300"}>
            {resource.name || "未命名资源"}
          </div>
        )}
        <DialogFooter>
          <Button variant={"default"} onClick={onCancel} disabled={deleting}>
            取消
          </Button>
          <Button
            variant={"danger"}
            onClick={() => resource && onConfirm(resource)}
            disabled={deleting}
          >
            删除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WorkbenchResourceNameCell({ resource }: { resource: WorkbenchResource }) {
  return (
    <div className={"flex min-w-0 items-center gap-3"}>
      <ResourceIcon resource={resource} />
      <div className={"min-w-0"}>
        <div className={"truncate font-medium text-neutral-900 dark:text-nb-gray-100"}>
          {resource.name || "未命名资源"}
        </div>
        <div className={"mt-1 truncate text-xs text-neutral-500 dark:text-nb-gray-400"}>
          {resource.url || "未配置 URL"}
        </div>
      </div>
    </div>
  );
}

function WorkbenchCategoryCell({ resource }: { resource: WorkbenchResource }) {
  return (
    <div className={"min-w-0"}>
      <div className={"truncate text-neutral-700 dark:text-nb-gray-300"}>
        {resource.category || "未分类"}
      </div>
      <div className={"mt-1 flex flex-wrap gap-1"}>
        {stringListValue(resource.tags).slice(0, 3).map((tag) => (
          <span
            key={tag}
            className={
              "rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500 dark:bg-nb-gray-800 dark:text-nb-gray-300"
            }
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function WorkbenchResourceActionCell({
  resource,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}: {
  resource: WorkbenchResource;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (resource: WorkbenchResource) => void;
  onDelete: (resource: WorkbenchResource) => void;
}) {
  return (
    <div className={"flex justify-end gap-2"}>
      <Button
        variant={"default-outline"}
        size={"xs"}
        onClick={() => onEdit(resource)}
        disabled={!canUpdate}
      >
        <PencilLine size={14} />
        编辑
      </Button>
      <Button
        variant={"danger-outline"}
        size={"xs"}
        onClick={() => onDelete(resource)}
        disabled={!canDelete || !buildWorkbenchResourcePathSuffix(resource.id)}
      >
        <Trash2 size={14} />
      </Button>
    </div>
  );
}

function WorkbenchStatusMenu({
  disabled,
  resource,
  onChange,
}: {
  disabled: boolean;
  resource: WorkbenchResource;
  onChange: (enabled: boolean) => void;
}) {
  const enabled = resource.enabled !== false;
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          variant={"default-outline"}
          size={"xs"}
          disabled={disabled}
          className={
            enabled
              ? "text-green-700 hover:text-green-800 dark:text-green-300"
              : "text-neutral-500 dark:text-nb-gray-400"
          }
        >
          {enabled ? "启用" : "停用"}
          <ChevronDown size={13} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className={"w-32"} align={"start"}>
        <DropdownMenuItem
          disabled={enabled}
          onClick={() => onChange(true)}
        >
          启用
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!enabled}
          onClick={() => onChange(false)}
        >
          停用
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function WorkbenchVisibilityMenu({
  disabled,
  resource,
  onSetAll,
  onEditRestricted,
}: {
  disabled: boolean;
  resource: WorkbenchResource;
  onSetAll: () => void;
  onEditRestricted: () => void;
}) {
  const restricted = resource.visibility === "restricted";
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          variant={"default-outline"}
          size={"xs"}
          disabled={disabled}
          className={"max-w-[170px] justify-start"}
        >
          <span className={"truncate"}>{formatVisibility(resource)}</span>
          <ChevronDown size={13} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className={"w-44"} align={"start"}>
        <DropdownMenuItem disabled={!restricted} onClick={onSetAll}>
          全部用户可见
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEditRestricted}>
          指定范围...
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function WorkbenchCategoryDialog({
  open,
  category,
  canSave,
  onCancel,
  onSave,
}: {
  open: boolean;
  category?: WorkbenchCategory;
  canSave: boolean;
  onCancel: () => void;
  onSave: (category: WorkbenchCategory) => Promise<void>;
}) {
  const isEditing = !!category?.id;
  const [draft, setDraft] = useState<WorkbenchCategory>(() =>
    createCategoryDraft(category),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    setDraft(createCategoryDraft(category));
    setError("");
  }, [category, open]);

  const submit = async () => {
    const next = {
      ...draft,
      name: textValue(draft.name),
      sort: Number(draft.sort || 0),
    };
    if (!next.name) {
      setError("分类名称必填。");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存工作台分类失败。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent className={"max-w-md"}>
        <DialogHeader>
          <DialogTitle>{isEditing ? "编辑工作台分类" : "新增工作台分类"}</DialogTitle>
          <DialogDescription>
            分类保存后会出现在新增资源和资源筛选里。
          </DialogDescription>
        </DialogHeader>
        <div className={"grid gap-4"}>
          <Field label={"分类名称"}>
            <Input
              value={draft.name}
              placeholder={"例如：内部系统"}
              onChange={(event) =>
                setDraft((current) => ({ ...current, name: event.target.value }))
              }
            />
          </Field>
          <Field label={"排序"}>
            <Input
              type={"number"}
              value={draft.sort}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  sort: Number(event.target.value || 0),
                }))
              }
            />
          </Field>
        </div>
        {error && <div className={"text-sm text-red-500"}>{error}</div>}
        {!canSave && (
          <div className={"text-sm text-neutral-500 dark:text-nb-gray-400"}>
            当前账号没有保存工作台分类的权限。
          </div>
        )}
        <DialogFooter>
          <Button variant={"default"} onClick={onCancel} disabled={saving}>
            取消
          </Button>
          <Button
            variant={"primary"}
            onClick={submit}
            disabled={saving || !canSave}
          >
            保存分类
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WorkbenchResourceDialog({
  open,
  canSave,
  resource,
  categories,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  canSave: boolean;
  resource?: WorkbenchResource;
  categories: WorkbenchCategory[];
  onOpenChange: (open: boolean) => void;
  onSave: (resource: WorkbenchResource) => void;
}) {
  const isEditing = !!buildWorkbenchResourcePathSuffix(resource?.id);
  const { groups } = useGroups();
  const { users } = useUsers();
  const iconRequest = useApiCall<WorkbenchIconResult>(
    "/workbench/admin/assets/icon",
  );
  const fetchIconRequest = useApiCall<WorkbenchIconResult>(
    "/workbench/admin/assets/fetch-icon",
  );
  const [draft, setDraft] = useState<WorkbenchResource>(() =>
    createDraft(resource),
  );
  const [tagsText, setTagsText] = useState(stringListValue(resource?.tags).join(", "));
  const [saving, setSaving] = useState(false);
  const [iconBusy, setIconBusy] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    setDraft(createDraft(resource));
    setTagsText(stringListValue(resource?.tags).join(", "));
    setError("");
  }, [resource, open]);

  const userGroups = useMemo(
    () => (groups ?? []).filter((group) => group.type === GroupType.USER),
    [groups],
  );

  const update = <K extends keyof WorkbenchResource>(
    key: K,
    value: WorkbenchResource[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const submit = async () => {
    let next = {
      ...draft,
      name: textValue(draft.name),
      category: textValue(draft.category),
      description: textValue(draft.description),
      iconUrl: textValue(draft.iconUrl),
      url: textValue(draft.url),
      tags: splitTags(tagsText),
      scope: "server",
      source: "admin",
      iconMode: draft.iconUrl ? draft.iconMode || "uploaded" : "letter",
      visibility:
        draft.visibility === "restricted" ? "restricted" : "all",
      visibleGroups:
        draft.visibility === "restricted" ? cleanIDList(draft.visibleGroups) : [],
      visibleUsers:
        draft.visibility === "restricted" ? cleanIDList(draft.visibleUsers) : [],
    };
    if (!next.name || !next.url) {
      setError("名称和 URL 必填。");
      return;
    }
    if (!isValidWorkbenchHTTPURL(next.url)) {
      setError("URL 必须是有效的 http 或 https 地址。");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (!next.iconUrl) {
        try {
          const result = await fetchIconRequest.post({ url: next.url });
          if (result.iconUrl) {
            next = {
              ...next,
              iconUrl: result.iconUrl,
              iconMode: result.iconMode || "fetched",
            };
          }
        } catch {
          next = { ...next, iconUrl: "", iconMode: "letter" };
        }
      }
      await onSave(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存工作台资源失败。");
    } finally {
      setSaving(false);
    }
  };

  const uploadIcon = async (file?: File, input?: HTMLInputElement | null) => {
    if (!file) return;
    if (file.size === 0) {
      setError("图标文件为空。");
      if (input) input.value = "";
      return;
    }
    if (file.size > maxWorkbenchIconBytes) {
      setError("图标文件不能超过 1MB。");
      if (input) input.value = "";
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    setIconBusy(true);
    setError("");
    try {
      const result = await iconRequest.post(formData);
      update("iconUrl", result.iconUrl);
      update("iconMode", result.iconMode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传图标失败。");
    } finally {
      setIconBusy(false);
      if (input) input.value = "";
    }
  };

  const fetchIcon = async () => {
    const url = textValue(draft.url);
    if (!url) {
      setError("请先填写资源 URL。");
      return;
    }
    if (!isValidWorkbenchHTTPURL(url)) {
      setError("URL 必须是有效的 http 或 https 地址。");
      return;
    }
    setIconBusy(true);
    setError("");
    try {
      const result = await fetchIconRequest.post({ url });
      update("iconUrl", result.iconUrl);
      update("iconMode", result.iconMode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取图标失败。");
    } finally {
      setIconBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={"max-w-3xl"}>
        <DialogHeader>
          <DialogTitle>{isEditing ? "编辑工作台资源" : "新增工作台资源"}</DialogTitle>
          <DialogDescription>
            服务器资源只控制工作台展示入口，不绑定 VPN 网络访问权限。
          </DialogDescription>
        </DialogHeader>

        <div className={"grid gap-4 md:grid-cols-2"}>
          <Field label={"名称"}>
            <Input
              value={draft.name}
              onChange={(event) => update("name", event.target.value)}
            />
          </Field>
          <Field label={"分类"}>
            <select
              value={categories.some((category) => category.name === draft.category) ? draft.category : ""}
              onChange={(event) => update("category", event.target.value)}
              className={
                "h-[42px] w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-800 outline-none focus:border-netbird-300 focus:ring-2 focus:ring-netbird-400/30 dark:border-nb-gray-800 dark:bg-nb-gray-920 dark:text-nb-gray-100"
              }
            >
              <option value={""}>选择分类</option>
              {categories.map((category) => (
                <option key={category.id ?? category.name} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={"URL"}>
            <Input
              value={draft.url}
              placeholder={"https://example.com"}
              onChange={(event) => update("url", event.target.value)}
            />
          </Field>
          <Field label={"图标 URL"}>
            <Input
              value={draft.iconUrl}
              placeholder={"/api/workbench/assets/..."}
              onChange={(event) => update("iconUrl", event.target.value)}
            />
          </Field>
          <div className={"flex items-end gap-3"}>
            <ResourceIcon resource={draft} />
            <label className={"flex-1"}>
              <span className={"mb-1.5 block text-xs font-medium text-neutral-500"}>
                图标
              </span>
              <input
                type={"file"}
                accept={"image/png,image/jpeg,image/gif,image/webp,image/x-icon,image/svg+xml"}
                className={"hidden"}
                id={"workbench-icon-upload"}
                onChange={(event) => uploadIcon(event.target.files?.[0], event.currentTarget)}
              />
              <Button
                variant={"secondary"}
                className={"w-full"}
                disabled={iconBusy || !canSave}
                onClick={() =>
                  document.getElementById("workbench-icon-upload")?.click()
                }
              >
                <ImagePlus size={16} />
                上传图标
              </Button>
            </label>
            <Button
              variant={"secondary"}
              disabled={iconBusy || !canSave}
              onClick={fetchIcon}
            >
              <DownloadCloud size={16} />
              从 URL 获取
            </Button>
          </div>
          <Field label={"标签"}>
            <Input
              value={tagsText}
              placeholder={"用逗号分隔"}
              onChange={(event) => setTagsText(event.target.value)}
            />
          </Field>
          <Field label={"排序"}>
            <Input
              type={"number"}
              value={draft.sort}
              onChange={(event) =>
                update("sort", Number(event.target.value || 0))
              }
            />
          </Field>
          <Field label={"描述"} className={"md:col-span-2"}>
            <Input
              value={draft.description}
              onChange={(event) => update("description", event.target.value)}
            />
          </Field>
        </div>

        <div className={"grid gap-4 rounded-md border border-neutral-200 p-4 dark:border-nb-gray-800"}>
          <div className={"text-sm font-medium text-neutral-900 dark:text-nb-gray-100"}>
            可见范围
          </div>
          <label className={"flex items-center gap-3 text-sm text-neutral-600 dark:text-nb-gray-300"}>
            <input
              type={"radio"}
              checked={draft.visibility !== "restricted"}
              onChange={() => update("visibility", "all")}
            />
            全部用户可见
          </label>
          <label className={"flex items-center gap-3 text-sm text-neutral-600 dark:text-nb-gray-300"}>
            <input
              type={"radio"}
              checked={draft.visibility === "restricted"}
              onChange={() => update("visibility", "restricted")}
            />
            仅指定用户组或用户可见
          </label>
          {draft.visibility === "restricted" && (
            <div className={"grid gap-4 md:grid-cols-2"}>
              <SelectionList
                title={"允许访问的用户组"}
                values={draft.visibleGroups ?? []}
                options={userGroups.map((group) => ({
                  id: group.id ?? "",
                  label: group.name,
                }))}
                onChange={(values) => update("visibleGroups", values)}
              />
              <SelectionList
                title={"允许访问的用户"}
                values={draft.visibleUsers ?? []}
                options={(users ?? []).map((user) => ({
                  id: user.id,
                  label: user.email || user.name,
                }))}
                onChange={(values) => update("visibleUsers", values)}
              />
            </div>
          )}
        </div>

        <div className={"grid gap-3 rounded-md border border-neutral-200 p-4 dark:border-nb-gray-800"}>
          <div className={"text-sm font-medium text-neutral-900 dark:text-nb-gray-100"}>
            显示设置
          </div>
          <div className={"flex flex-wrap gap-5"}>
            <label className={"flex items-center gap-3 text-sm text-neutral-600 dark:text-nb-gray-300"}>
              <Checkbox
                checked={draft.enabled}
                onCheckedChange={(checked) => update("enabled", checked === true)}
              />
              启用资源
            </label>
            <label className={"flex items-center gap-3 text-sm text-neutral-600 dark:text-nb-gray-300"}>
              <Checkbox
                checked={draft.favorite}
                onCheckedChange={(checked) => update("favorite", checked === true)}
              />
              客户端优先显示
            </label>
          </div>
        </div>

        {error && <div className={"text-sm text-red-500"}>{error}</div>}
        {!canSave && (
          <div className={"text-sm text-neutral-500 dark:text-nb-gray-400"}>
            当前账号没有保存工作台资源的权限。
          </div>
        )}

        <DialogFooter>
          <Button variant={"default"} onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button variant={"primary"} onClick={submit} disabled={saving || !canSave}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <label className={className}>
      <span className={"mb-1.5 block text-xs font-medium text-neutral-500"}>
        {label}
      </span>
      {children}
    </label>
  );
}

function SelectionList({
  title,
  values,
  options,
  onChange,
}: {
  title: string;
  values: string[];
  options: Array<{ id: string; label: string }>;
  onChange: (values: string[]) => void;
}) {
  const valueSet = new Set(values);
  const toggle = (id: string) => {
    if (!id) return;
    if (valueSet.has(id)) {
      onChange(values.filter((value) => value !== id));
    } else {
      onChange([...values, id]);
    }
  };

  return (
    <div>
      <div className={"mb-2 text-xs font-medium text-neutral-500"}>{title}</div>
      <div className={"max-h-44 overflow-auto rounded-md border border-neutral-200 p-2 dark:border-nb-gray-800"}>
        {options.length === 0 ? (
          <div className={"px-2 py-4 text-sm text-neutral-500"}>暂无可选项。</div>
        ) : (
          options.map((option) => (
            <label
              key={option.id}
              className={
                "flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm text-neutral-600 hover:bg-neutral-50 dark:text-nb-gray-300 dark:hover:bg-nb-gray-900"
              }
            >
              <Checkbox
                checked={valueSet.has(option.id)}
                onCheckedChange={() => toggle(option.id)}
              />
              <span className={"truncate"}>{option.label}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}

function ResourceIcon({ resource }: { resource: WorkbenchResource }) {
  const iconUrl = useWorkbenchIconURL(resource.iconUrl);
  if (iconUrl) {
    return (
      <div className={"h-10 w-10 overflow-hidden rounded-md bg-neutral-100"}>
        <Image
          src={iconUrl}
          alt={""}
          width={40}
          height={40}
          unoptimized
          className={"h-full w-full object-cover"}
        />
      </div>
    );
  }
  return (
    <div
      className={
        "flex h-10 w-10 items-center justify-center rounded-md bg-netbird-50 text-netbird dark:bg-netbird-950/30 dark:text-netbird-300"
      }
    >
      <Globe2 size={18} />
    </div>
  );
}

function useWorkbenchIconURL(iconUrl?: string) {
  const assetPath = workbenchAssetPath(iconUrl);
  const assetRequest = useApiCall<Blob>(assetPath, true, { blob: true });
  const [objectURL, setObjectURL] = useState("");
  const isWorkbenchAsset = assetPath !== "";
  const iconURLValue = textValue(iconUrl);

  React.useEffect(() => {
    let cancelled = false;
    let currentObjectURL = "";
    setObjectURL("");
    if (!iconURLValue || !isWorkbenchAsset) {
      return;
    }

    assetRequest
      .get()
      .then((blob) => {
        const nextURL = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(nextURL);
          return;
        }
        currentObjectURL = nextURL;
        setObjectURL(nextURL);
      })
      .catch(() => {
        if (!cancelled) setObjectURL("");
      });

    return () => {
      cancelled = true;
      if (currentObjectURL) {
        URL.revokeObjectURL(currentObjectURL);
      }
    };
    // assetRequest is intentionally excluded because useApiCall returns a new object each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetPath, iconURLValue, isWorkbenchAsset]);

  if (!iconURLValue) return "";
  if (isWorkbenchAsset) return objectURL;
  return safeWorkbenchIconDisplayURL(iconURLValue);
}

function createDraft(resource?: WorkbenchResource): WorkbenchResource {
  return {
    id: resource?.id,
    name: resource?.name ?? "",
    category: resource?.category ?? "",
    description: resource?.description ?? "",
    iconUrl: resource?.iconUrl ?? "",
    iconMode: resource?.iconMode ?? "letter",
    url: resource?.url ?? "",
    tags: stringListValue(resource?.tags),
    enabled: resource?.enabled ?? true,
    favorite: resource?.favorite ?? false,
    sort: resource?.sort ?? 0,
    scope: "server",
    source: "admin",
    visibility: resource?.visibility ?? "all",
    visibleGroups: cleanIDList(resource?.visibleGroups),
    visibleUsers: cleanIDList(resource?.visibleUsers),
    metadata: resource?.metadata ?? {},
  };
}

function createCategoryDraft(category?: WorkbenchCategory): WorkbenchCategory {
  return {
    id: category?.id,
    name: category?.name ?? "",
    sort: category?.sort ?? 0,
  };
}

function splitTags(value: string) {
  return value
    .split(/[,，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function formatVisibility(resource: WorkbenchResource) {
  if (resource.visibility !== "restricted") {
    return "全部用户";
  }
  const groups = cleanIDList(resource.visibleGroups).length;
  const users = cleanIDList(resource.visibleUsers).length;
  if (groups === 0 && users === 0) {
    return "未选择";
  }
  return `${groups} 个组 / ${users} 个用户`;
}
