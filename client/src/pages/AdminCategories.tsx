import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Loader2, Edit2, Trash2, Plus, X } from "lucide-react";
import { toast } from "sonner";

export default function AdminCategories() {
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", slug: "", description: "" });

  const { data: categories, isLoading, refetch } = trpc.categories.list.useQuery();
  const createCategory = trpc.categories.create.useMutation();
  const updateCategory = trpc.categories.update.useMutation();
  const deleteCategory = trpc.categories.delete.useMutation();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.slug) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          ...formData,
        });
        toast.success("Category updated successfully");
      } else {
        await createCategory.mutateAsync(formData);
        toast.success("Category created successfully");
      }
      setShowForm(false);
      setEditingCategory(null);
      setFormData({ name: "", slug: "", description: "" });
      refetch();
    } catch (error) {
      toast.error("Failed to save category");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      await deleteCategory.mutateAsync({ id });
      toast.success("Category deleted successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to delete category");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">Categories</h1>
        <Button
          onClick={() => {
            setEditingCategory(null);
            setFormData({ name: "", slug: "", description: "" });
            setShowForm(true);
          }}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 mb-8 border-2 border-primary/50">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              {editingCategory ? "Edit Category" : "Create Category"}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingCategory(null);
              }}
              className="p-1 hover:bg-muted rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Category Name *
              </label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Masbaha"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Slug *
              </label>
              <Input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                placeholder="e.g., masbaha"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Category description..."
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {editingCategory ? "Update Category" : "Create Category"}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingCategory(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : categories && categories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card key={category.id} className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">{category.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
              <p className="text-xs text-muted-foreground mb-4">Slug: {category.slug}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="flex-1 p-2 hover:bg-primary/10 rounded transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4 text-primary" />
                  <span className="text-sm">Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="flex-1 p-2 hover:bg-destructive/10 rounded transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                  <span className="text-sm">Delete</span>
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">No categories yet</p>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Create First Category
          </Button>
        </Card>
      )}
    </div>
  );
}
