import React, { useState } from 'react';
import { useI18n } from '../../i18n/index';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { toast } from 'sonner';
import {
  sanitizeName,
  sanitizePhone,
  sanitizeEmailLocal,
  sanitizePlate,
  verifyAddressOSM,
} from '../../utils/inputValidators';

export const NewDeliveryForm = ({ drivers, onSubmit, onCancel }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    recipient_name: '',
    recipient_address: '',
    recipient_phone: '',
    package_description: '',
    weight_kg: 1,
    driver_id: ''
  });
  const [addressError, setAddressError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAddressError('');
    setVerifying(true);
    const result = await verifyAddressOSM(formData.recipient_address);
    setVerifying(false);
    if (!result.ok) {
      setAddressError(t('toasts.addressInvalid', 'Adresse introuvable ou invalide. Vérifiez l\'orthographe et le code postal.'));
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>{t('modals.newDelivery.driver', 'Chauffeur assigné')}</Label>
        <select
          value={formData.driver_id}
          onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
          className="w-full h-12 bg-[#0A0A0B] border border-[#27272A] rounded-lg px-3 text-white text-sm"
          data-testid="delivery-driver-select"
        >
          <option value="">— {t('modals.newDelivery.noDriver', 'Non assigné')} —</option>
          {(drivers || []).map(d => (
            <option key={d.id} value={d.id}>{d.name} {d.vehicle_plate ? `(${d.vehicle_plate})` : ''}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label>{t('modals.newDelivery.recipientName', 'Nom du destinataire')}</Label>
        <Input
          value={formData.recipient_name}
          onChange={(e) => setFormData({ ...formData, recipient_name: sanitizeName(e.target.value) })}
          required
          placeholder={t('modals.newDelivery.recipientNamePh', 'Jean Dupont')}
          className="bg-[#0A0A0B] border-[#27272A]"
          data-testid="delivery-recipient-name"
        />
      </div>
      <div className="space-y-2">
        <Label>{t('modals.newDelivery.address', 'Adresse')}</Label>
        <Input
          value={formData.recipient_address}
          onChange={(e) => { setFormData({ ...formData, recipient_address: e.target.value }); if (addressError) setAddressError(''); }}
          required
          placeholder={t('modals.newDelivery.addressPh', '12 Rue de la Paix, 75002 Paris')}
          className={`bg-[#0A0A0B] ${addressError ? 'border-red-500 ring-1 ring-red-500/60' : 'border-[#27272A]'}`}
          data-testid="delivery-address"
        />
        {addressError && <p className="text-xs text-red-400 mt-1" data-testid="delivery-address-error">{addressError}</p>}
      </div>
      <div className="space-y-2">
        <Label>{t('modals.newDelivery.recipientPhone', 'Téléphone')}</Label>
        <Input
          value={formData.recipient_phone}
          onChange={(e) => setFormData({ ...formData, recipient_phone: sanitizePhone(e.target.value) })}
          required
          inputMode="numeric"
          placeholder="+33 6 12 34 56 78"
          className="bg-[#0A0A0B] border-[#27272A]"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>{t('modals.newDelivery.packageDesc', 'Description colis')}</Label>
          <Input
            value={formData.package_description}
            onChange={(e) => setFormData({ ...formData, package_description: e.target.value })}
            required
            className="bg-[#0A0A0B] border-[#27272A]"
          />
        </div>
        <div className="space-y-2">
          <Label>{t('modals.newDelivery.weight', 'Poids (kg)')}</Label>
          <Input
            type="number" step="0.1" min="0.1"
            value={formData.weight_kg}
            onChange={(e) => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) })}
            required
            className="bg-[#0A0A0B] border-[#27272A]"
          />
        </div>
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 border-[#27272A]">
          {t('actions.cancel', 'Annuler')}
        </Button>
        <Button type="submit" disabled={verifying} className="flex-1 bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-50" data-testid="delivery-submit-btn">
          {verifying ? t('modals.newDelivery.verifying', 'Vérification…') : t('actions.create', 'Créer')}
        </Button>
      </div>
    </form>
  );
};

const GMAIL_DOMAIN = '@gmail.com';

export const NewDriverForm = ({ onSubmit, onCancel }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    name: '',
    emailLocal: '',
    password: '',
    phone: '',
    vehicle_plate: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.emailLocal) {
      toast.error(t('toasts.emailRequired', 'Email requis'));
      return;
    }
    onSubmit({
      name: formData.name,
      email: `${formData.emailLocal}${GMAIL_DOMAIN}`,
      password: formData.password,
      phone: formData.phone,
      vehicle_plate: formData.vehicle_plate,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>{t('modals.addDriver.name', 'Nom complet')}</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: sanitizeName(e.target.value) })}
          required
          placeholder={t('modals.addDriver.namePh', 'Jean Dupont')}
          className="bg-[#0A0A0B] border-[#27272A]"
          data-testid="driver-name-input"
        />
      </div>
      <div className="space-y-2">
        <Label>{t('modals.addDriver.email', 'Email')}</Label>
        <div className="flex items-stretch rounded-lg border border-[#27272A] focus-within:border-[#0066FF] bg-[#0A0A0B] overflow-hidden">
          <input
            type="text"
            value={formData.emailLocal}
            onChange={(e) => setFormData({ ...formData, emailLocal: sanitizeEmailLocal(e.target.value) })}
            required
            placeholder={t('modals.addDriver.emailLocalPh', 'jeandupont')}
            className="flex-1 bg-transparent px-3 py-2 text-white text-sm outline-none"
            data-testid="driver-email-local"
          />
          <span className="px-3 flex items-center text-sm text-zinc-400 bg-[#1A1A1E] border-l border-[#27272A] select-none" data-testid="email-suffix">
            {GMAIL_DOMAIN}
          </span>
        </div>
      </div>
      <div className="space-y-2">
        <Label>{t('modals.addDriver.password', 'Mot de passe')}</Label>
        <Input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          minLength={8}
          placeholder="••••••••"
          className="bg-[#0A0A0B] border-[#27272A]"
        />
      </div>
      <div className="space-y-2">
        <Label>{t('modals.addDriver.phone', 'Téléphone')}</Label>
        <Input
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: sanitizePhone(e.target.value) })}
          inputMode="numeric"
          placeholder="0612345678"
          className="bg-[#0A0A0B] border-[#27272A]"
          data-testid="driver-phone-input"
        />
      </div>
      <div className="space-y-2">
        <Label>{t('modals.addDriver.vehiclePlate', 'Immatriculation véhicule')}</Label>
        <Input
          value={formData.vehicle_plate}
          onChange={(e) => setFormData({ ...formData, vehicle_plate: sanitizePlate(e.target.value) })}
          placeholder="AB-123-CD"
          className="bg-[#0A0A0B] border-[#27272A] uppercase"
          data-testid="driver-plate-input"
        />
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 border-[#27272A]">
          {t('actions.cancel', 'Annuler')}
        </Button>
        <Button type="submit" className="flex-1 bg-[#0066FF] hover:bg-[#0052CC]">
          {t('modals.addDriver.submit', 'Ajouter le chauffeur')}
        </Button>
      </div>
    </form>
  );
};

export const EditDriverForm = ({ driver, onSubmit, onCancel }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    name: driver?.name || '',
    phone: driver?.phone || '',
    vehicle_plate: driver?.vehicle_plate || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit(formData);
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-[#1A1A1E] rounded-lg">
        <p className="text-xs text-zinc-400">Email</p>
        <p className="font-mono text-sm text-zinc-300" data-testid="edit-driver-email">{driver?.email || '—'}</p>
      </div>
      <div className="space-y-2">
        <Label>{t('modals.addDriver.name', 'Nom complet')}</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: sanitizeName(e.target.value) })}
          required
          className="bg-[#0A0A0B] border-[#27272A]"
          data-testid="edit-driver-name"
        />
      </div>
      <div className="space-y-2">
        <Label>{t('modals.addDriver.phone', 'Téléphone')}</Label>
        <Input
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: sanitizePhone(e.target.value) })}
          inputMode="numeric"
          className="bg-[#0A0A0B] border-[#27272A]"
          data-testid="edit-driver-phone"
        />
      </div>
      <div className="space-y-2">
        <Label>{t('modals.addDriver.vehiclePlate', 'Immatriculation véhicule')}</Label>
        <Input
          value={formData.vehicle_plate}
          onChange={(e) => setFormData({ ...formData, vehicle_plate: sanitizePlate(e.target.value) })}
          placeholder="AB-123-CD"
          className="bg-[#0A0A0B] border-[#27272A] uppercase"
          data-testid="edit-driver-plate"
        />
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 border-[#27272A]">
          {t('actions.cancel', 'Annuler')}
        </Button>
        <Button type="submit" disabled={saving} className="flex-1 bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-50" data-testid="edit-driver-submit">
          {saving ? t('actions.saving', 'Enregistrement…') : t('actions.save', 'Enregistrer')}
        </Button>
      </div>
    </form>
  );
};

export const AssignDeliveryForm = ({ trackingId, delivery, drivers, onSubmit, onCancel }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    client_name: delivery?.recipient_name || '',
    address: delivery?.recipient_address || '',
    driver_id: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.driver_id) {
      toast.error(t('toasts.driverRequired', 'Veuillez sélectionner un chauffeur'));
      return;
    }
    setIsSubmitting(true);
    await onSubmit(formData);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" data-testid="assign-delivery-form">
      <div className="p-3 bg-[#1A1A1E] rounded-lg">
        <p className="text-xs text-zinc-400">{t('modals.assignDriver.delivery', 'Livraison')}</p>
        <p className="font-mono font-semibold text-[#0066FF]">{trackingId}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="client_name">{t('modals.assignDriver.clientName', 'Nom du Client')}</Label>
        <Input
          id="client_name"
          value={formData.client_name}
          onChange={(e) => setFormData({ ...formData, client_name: sanitizeName(e.target.value) })}
          placeholder={t('modals.assignDriver.clientNamePh', 'Entrez le nom du client')}
          className="h-12 bg-[#0A0A0B] border border-[#27272A] focus:border-[#0066FF]"
          data-testid="client-name-input"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">{t('modals.assignDriver.address', 'Adresse de Livraison')}</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder={t('modals.assignDriver.addressPh', "Entrez l'adresse complète")}
          className="h-12 bg-[#0A0A0B] border border-[#27272A] focus:border-[#0066FF]"
          data-testid="address-input"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="driver">{t('modals.assignDriver.driver', 'Chauffeur')}</Label>
        <Select
          value={formData.driver_id}
          onValueChange={(value) => setFormData({ ...formData, driver_id: value })}
        >
          <SelectTrigger
            className="h-12 bg-[#0A0A0B] border border-[#27272A] focus:border-[#0066FF]"
            data-testid="driver-select"
          >
            <SelectValue placeholder={t('modals.assignDriver.selectDriver', 'Sélectionnez un chauffeur')} />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1A1E] border border-[#27272A]">
            {drivers.length === 0 ? (
              <SelectItem value="none" disabled>{t('modals.assignDriver.noDrivers', 'Aucun chauffeur disponible')}</SelectItem>
            ) : (
              drivers.map((driver) => (
                <SelectItem
                  key={driver.id}
                  value={driver.id}
                  className="hover:bg-[#27272A] cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{driver.name}</span>
                    {driver.vehicle_plate && (
                      <span className="text-zinc-400 text-sm">({driver.vehicle_plate})</span>
                    )}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-12 border border-[#27272A] hover:bg-[#1A1A1E]"
        >
          {t('actions.cancel', 'Annuler')}
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !formData.driver_id}
          className="flex-1 h-12 bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-50"
          data-testid="confirm-assign-btn"
        >
          {isSubmitting ? t('modals.assignDriver.submitting', 'Assignation...') : t('modals.assignDriver.submit', "Confirmer l'Assignation")}
        </Button>
      </div>
    </form>
  );
};
