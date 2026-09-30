"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

export default function EditTurfPage() {
  const params = useParams();
  const router = useRouter();
  const turfId = params?.id as Id<"turfs">;

  const turf = useQuery(api.turfs.getTurfById, { turfId });
  const updateTurf = useMutation(api.turfs.updateTurf);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    sportType: "football" as "football" | "cricket" | "futsal" | "multi",
    size: "",
    basePrice: 0,
    description: "",
    operatingStart: "",
    operatingEnd: "",
    amenities: "",
    isActive: true,
    images: [] as string[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");

  // Populate form when turf data loads
  useEffect(() => {
    if (turf) {
      setFormData({
        name: turf.name,
        location: turf.location,
        sportType: turf.sportType,
        size: turf.size,
        basePrice: turf.basePrice,
        description: turf.description,
        operatingStart: turf.operatingHours.start,
        operatingEnd: turf.operatingHours.end,
        amenities: turf.amenities.join(", "),
        isActive: turf.isActive,
        images: turf.images || [],
      });
    }
  }, [turf]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateTurf({
        turfId,
        name: formData.name,
        location: formData.location,
        sportType: formData.sportType,
        size: formData.size,
        basePrice: formData.basePrice,
        description: formData.description,
        operatingHours: {
          start: formData.operatingStart,
          end: formData.operatingEnd,
        },
        amenities: formData.amenities
          .split(",")
          .map((a) => a.trim())
          .filter((a) => a),
        isActive: formData.isActive,
        images: formData.images,
      });

      alert("Turf updated successfully!");
      router.push("/owner-dashboard");
    } catch (error) {
      console.error("Error updating turf:", error);
      alert("Failed to update turf. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setFormData({
        ...formData,
        images: [...formData.images, newImageUrl.trim()],
      });
      setNewImageUrl("");
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  if (!turf) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading turf details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/owner-dashboard")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Turf</h1>
          <p className="text-muted-foreground">Update your turf details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Turf Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="sportType">Sport Type *</Label>
                <select
                  id="sportType"
                  value={formData.sportType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sportType: e.target.value as any,
                    })
                  }
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="football">Football</option>
                  <option value="cricket">Cricket</option>
                  <option value="futsal">Futsal</option>
                  <option value="multi">Multi-Sport</option>
                </select>
              </div>

              <div>
                <Label htmlFor="size">Size *</Label>
                <Input
                  id="size"
                  placeholder="e.g., 5-a-side, 7-a-side"
                  value={formData.size}
                  onChange={(e) =>
                    setFormData({ ...formData, size: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="basePrice">Base Price (per hour) *</Label>
                <Input
                  id="basePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.basePrice}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      basePrice: parseFloat(e.target.value),
                    })
                  }
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="operatingStart">Opening Time *</Label>
                <Input
                  id="operatingStart"
                  type="time"
                  value={formData.operatingStart}
                  onChange={(e) =>
                    setFormData({ ...formData, operatingStart: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="operatingEnd">Closing Time *</Label>
                <Input
                  id="operatingEnd"
                  type="time"
                  value={formData.operatingEnd}
                  onChange={(e) =>
                    setFormData({ ...formData, operatingEnd: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="amenities">Amenities (comma-separated)</Label>
                <Input
                  id="amenities"
                  placeholder="e.g., Parking, Changing Room, Shower"
                  value={formData.amenities}
                  onChange={(e) =>
                    setFormData({ ...formData, amenities: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Active (visible to customers)
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Describe your turf..."
                rows={5}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </CardContent>
          </Card>

          {/* Images */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter image URL"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddImage();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddImage}>
                  Add Image
                </Button>
              </div>

              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Turf image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://placehold.co/400x300/e2e8f0/94a3b8?text=Invalid+URL";
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveImage(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/owner-dashboard")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
