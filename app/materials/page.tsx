// app/materials/page.tsx
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { useMaterials, useDeleteMaterial } from '@/hooks/useMaterials'
import { Plus, Edit, Trash2, Package } from 'lucide-react'
import type { MaterialFilters } from '@/types/materials'

export default function MaterialsPage() {
  const [filters, setFilters] = useState<MaterialFilters>({
    page: 1,
    limit: 20,
  })

  const { data, isLoading, error } = useMaterials(filters)
  const deleteMutation = useDeleteMaterial()

  const materials = data?.data || []
  const meta = data?.meta

  // Unika kategorier
  const categories = Array.from(new Set(materials.map((m: any) => m.category).filter(Boolean)))

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Är du säker på att du vill radera "${name}"?`)) {
      await deleteMutation.mutateAsync(id)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 lg:ml-0">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-teal-500 to-green-600 rounded-lg shadow-lg">
                  <Package size={32} className="text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Materialdatabas
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Hantera material och priser
                  </p>
                </div>
              </div>
              <Link href="/materials/new">
                <Button size="lg" className="shadow-lg bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700">
                  <Plus size={20} className="mr-2" />
                  Nytt Material
                </Button>
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-800 rounded-xl shadow-xl border-2 border-gray-200 dark:border-gray-700 p-6 mb-6 backdrop-blur-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Sök"
                type="search"
                placeholder="Sök efter namn eller SKU..."
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              />

              <Select
                label="Kategori"
                value={filters.category || ''}
                onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
              >
                <option value="">Alla kategorier</option>
                {categories.map((cat: string) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>

              {(filters.search || filters.category) && (
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    onClick={() => setFilters({ page: 1, limit: 20 })}
                    className="w-full"
                  >
                    Rensa filter
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Laddar material...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
              <p className="text-red-600">Ett fel uppstod: {(error as Error).message}</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && materials.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full">
                  <Package size={48} className="text-gray-400" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Inga material ännu
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Lägg till material för att snabbt kunna välja dem i offerter
              </p>
              <Link href="/materials/new">
                <Button size="lg" className="bg-gradient-to-r from-teal-600 to-green-600">
                  <Plus size={20} className="mr-2" />
                  Skapa ditt första material
                </Button>
              </Link>
            </div>
          )}

          {/* Materials Table */}
          {!isLoading && !error && materials.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Namn</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Enhet</TableHead>
                    <TableHead className="text-right">Pris</TableHead>
                    <TableHead className="text-right">Åtgärder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((material: any) => (
                    <TableRow key={material.id}>
                      <TableCell>
                        <span className="font-mono text-sm text-gray-500">
                          {material.sku || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {material.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        {material.category && (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                            {material.category}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{material.unit}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {material.price.toLocaleString('sv-SE')} kr
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/materials/${material.id}/edit`}>
                            <button className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors">
                              <Edit size={16} />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDelete(material.id, material.name)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {meta && meta.count > meta.limit && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Visar {((meta.page - 1) * meta.limit) + 1} - {Math.min(meta.page * meta.limit, meta.count)} av {meta.count}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={meta.page === 1}
                      onClick={() => setFilters({ ...filters, page: meta.page - 1 })}
                    >
                      Föregående
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={meta.page * meta.limit >= meta.count}
                      onClick={() => setFilters({ ...filters, page: meta.page + 1 })}
                    >
                      Nästa
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

