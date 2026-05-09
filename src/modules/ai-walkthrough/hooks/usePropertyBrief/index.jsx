import { useState } from 'react';

const initialPropertyBrief = {
  location: "", propertyType: "", price: "", priceRange: "",
  bedrooms: 2, bathrooms: 2, area: "",
  selectedFeatures: [], selectedAmenities: [],
  furnishing: "", facing: "", floor: "",
  keyFeatures: "", amenities: "",
};

export const usePropertyBrief = () => {
  const [propertyBrief, setPropertyBrief] = useState(initialPropertyBrief);
  const [propertyDrawerOpen, setPropertyDrawerOpen] = useState(false);

  const updatePropertyBrief = (updates) => {
    setPropertyBrief(prev => ({ ...prev, ...updates }));
  };

  const toggleFeature = (feature) => {
    setPropertyBrief(prev => ({
      ...prev,
      selectedFeatures: prev.selectedFeatures.includes(feature)
        ? prev.selectedFeatures.filter(f => f !== feature)
        : [...prev.selectedFeatures, feature]
    }));
  };

  const toggleAmenity = (amenityId) => {
    setPropertyBrief(prev => ({
      ...prev,
      selectedAmenities: prev.selectedAmenities.includes(amenityId)
        ? prev.selectedAmenities.filter(a => a !== amenityId)
        : [...prev.selectedAmenities, amenityId]
    }));
  };

  const getFilledCount = () => {
    return [
      propertyBrief.location, propertyBrief.propertyType, 
      propertyBrief.price || propertyBrief.priceRange,
      propertyBrief.area, propertyBrief.furnishing, 
      propertyBrief.facing, propertyBrief.floor,
      (propertyBrief.selectedFeatures?.length > 0), 
      (propertyBrief.selectedAmenities?.length > 0),
    ].filter(Boolean).length;
  };

  return {
    propertyBrief,
    setPropertyBrief,
    updatePropertyBrief,
    toggleFeature,
    toggleAmenity,
    propertyDrawerOpen,
    setPropertyDrawerOpen,
    getFilledCount
  };
};