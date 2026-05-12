import React, { useState } from 'react';
import { Select, Spin } from 'antd';
import axios from 'axios';
import { useTranslation } from '@/hooks/useTranslation';

interface AddressOption {
  label: string;
  value: string;
  lat: number;
  lng: number;
}

interface AddressAutocompleteProps {
  placeholder?: string;
  onSelect: (lat: number, lng: number, address: string) => void;
  disabled?: boolean;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  placeholder,
  onSelect,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const [options, setOptions] = useState<AddressOption[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query: string) => {
    if (!query || query.length < 3) {
      setOptions([]);
      return;
    }

    setLoading(true);
    try {
      // NOTE: Using OpenStreetMap (Nominatim) as a free default.
      // For production in Vietnam, you should switch to Goong Maps or Google Maps.
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: query,
          format: 'json',
          addressdetails: 1,
          limit: 5,
          countrycodes: 'vn',
        },
      });

      const formatted = response.data.map((item: NominatimResult) => ({
        label: item.display_name,
        value: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      }));

      setOptions(formatted);
    } catch (error) {
      console.error('Address search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Select
      showSearch
      placeholder={placeholder || t('vnAddress.streetPlaceholder')}
      filterOption={false}
      onSearch={handleSearch}
      onChange={(_, option) => {
        const addrOption = option as AddressOption | undefined;
        if (addrOption) {
          onSelect(addrOption.lat, addrOption.lng, addrOption.label);
        }
      }}
      notFoundContent={loading ? <Spin size="small" /> : null}
      options={options}
      disabled={disabled}
      className="w-full"
      allowClear
    />
  );
};
