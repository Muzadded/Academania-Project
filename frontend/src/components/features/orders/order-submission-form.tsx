'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { ServiceDto } from '@academania/shared';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

// ─── Schema ──────────────────────────────────────────────────────────────────

const orderSchema = z.object({
  serviceId: z.string().min(1, 'Please select a service'),
  clientName: z.string().min(2, 'Name must be at least 2 characters'),
  clientEmail: z.string().email('Please enter a valid email address'),
  university: z.string().min(2, 'Please enter your university name'),
  budget: z.coerce.number().min(1, 'Budget must be at least $1'),
  deadline: z.string().min(1, 'Please select a deadline'),
  description: z.string().min(20, 'Please describe your project in at least 20 characters'),
  meetingSlots: z
    .array(
      z.object({
        preferredAt: z.string().min(1, 'Please select a preferred date and time'),
        priority: z.number(),
      }),
    )
    .min(1, 'Please add at least one preferred meeting time'),
});

type OrderFormValues = z.infer<typeof orderSchema>;

// ─── Constants ───────────────────────────────────────────────────────────────

const STEPS = ['Service', 'Your Details', 'Project Info', 'Meeting'];

type StepField = keyof OrderFormValues;
const STEP_FIELDS: StepField[][] = [
  ['serviceId'],
  ['clientName', 'clientEmail', 'university'],
  ['budget', 'deadline', 'description'],
  ['meetingSlots'],
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

const TODAY = new Date().toISOString().split('T')[0];
const NOW_LOCAL = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
  .toISOString()
  .slice(0, 16);

// ─── Component ───────────────────────────────────────────────────────────────

export function OrderSubmissionForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      serviceId: '',
      clientName: '',
      clientEmail: '',
      university: '',
      budget: '' as unknown as number,
      deadline: '',
      description: '',
      meetingSlots: [{ preferredAt: '', priority: 1 }],
    },
  });

  const {
    fields: slots,
    append: appendSlot,
    remove: removeSlot,
  } = useFieldArray({ control: form.control, name: 'meetingSlots' });

  // Fetch available services
  useEffect(() => {
    fetch(`${API_URL}/services`)
      .then((r) => r.json())
      .then((json) => setServices(Array.isArray(json.data) ? json.data : []))
      .catch(() => setServices([]))
      .finally(() => setLoadingServices(false));
  }, []);

  // Validate current step fields and advance
  async function goNext() {
    const valid = await form.trigger(STEP_FIELDS[step] as Parameters<typeof form.trigger>[0]);
    if (valid) setStep((s) => s + 1);
  }

  async function onSubmit(data: OrderFormValues) {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const body = new FormData();
      body.append('serviceId', data.serviceId);
      body.append('clientName', data.clientName);
      body.append('clientEmail', data.clientEmail);
      body.append('university', data.university);
      body.append('budget', String(data.budget));
      // Interpret the date-only string as local midnight to avoid off-by-one day in UTC
      body.append('deadline', new Date(data.deadline + 'T00:00:00').toISOString());
      body.append('description', data.description);
      body.append(
        'meetingSlots',
        JSON.stringify(
          data.meetingSlots.map((slot, i) => ({
            preferredAt: new Date(slot.preferredAt).toISOString(),
            priority: i + 1,
          })),
        ),
      );
      const file = fileRef.current?.files?.[0];
      if (file) body.append('file', file);

      const res = await fetch(`${API_URL}/orders`, { method: 'POST', body });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? 'Failed to submit order');
      }

      const json = await res.json();
      const ref: string = json?.data?.referenceNumber ?? '';
      router.push(`/order/success${ref ? `?ref=${ref}` : ''}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      );
      setSubmitting(false);
    }
  }

  // ─── Step renders ──────────────────────────────────────────────────────────

  function renderStep1() {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold">Choose Your Service</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Select the type of academic assistance you need.
          </p>
        </div>

        {loadingServices ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : services.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No services available at the moment.
          </p>
        ) : (
          <FormField
            control={form.control}
            name="serviceId"
            render={({ field }) => (
              <FormItem>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {services.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => field.onChange(service.id)}
                      className={`text-left rounded-xl border p-4 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        field.value === service.id
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50 hover:bg-accent/30'
                      }`}
                    >
                      {service.icon && <span className="text-2xl mb-2 block">{service.icon}</span>}
                      <p className="font-medium text-sm">{service.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {service.description}
                      </p>
                    </button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    );
  }

  function renderStep2() {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold">Your Details</h2>
          <p className="text-sm text-muted-foreground mt-1">
            We&apos;ll use this information to communicate with you about your order.
          </p>
        </div>

        <FormField
          control={form.control}
          name="clientName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Smith" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="clientEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="university"
          render={({ field }) => (
            <FormItem>
              <FormLabel>University / Institution</FormLabel>
              <FormControl>
                <Input placeholder="University of Example" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    );
  }

  function renderStep3() {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold">Project Details</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Describe your project so we can assist you accurately.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget (USD)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    placeholder="e.g. 150"
                    {...field}
                    value={field.value === ('' as unknown as number) ? '' : field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deadline</FormLabel>
                <FormControl>
                  <Input type="date" min={TODAY} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Description</FormLabel>
              <FormControl>
                <textarea
                  className="flex min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  placeholder="Describe your topic, requirements, citation style, page count, and any other relevant details..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Requirement File <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="flex w-full text-sm text-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
          />
          <p className="text-xs text-muted-foreground">Accepted formats: PDF, DOC, DOCX, TXT</p>
        </div>
      </div>
    );
  }

  function renderStep4() {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold">Meeting Preferences</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Add up to 3 preferred meeting times. We&apos;ll confirm the most suitable slot within 24
            hours.
          </p>
        </div>

        <div className="space-y-3">
          {slots.map((slot, index) => (
            <FormField
              key={slot.id}
              control={form.control}
              name={`meetingSlots.${index}.preferredAt`}
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold">
                      {index + 1}
                    </span>
                    <FormControl>
                      <Input type="datetime-local" min={NOW_LOCAL} className="flex-1" {...field} />
                    </FormControl>
                    {slots.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSlot(index)}
                        className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove slot</span>
                      </Button>
                    )}
                  </div>
                  <FormMessage className="ml-9" />
                </FormItem>
              )}
            />
          ))}
        </div>

        {slots.length < 3 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendSlot({ preferredAt: '', priority: slots.length + 1 })}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Another Time Slot
          </Button>
        )}

        {submitError && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive mt-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}
      </div>
    );
  }

  // ─── Layout ────────────────────────────────────────────────────────────────

  const stepRenderers = [renderStep1, renderStep2, renderStep3, renderStep4];
  const isLastStep = step === STEPS.length - 1;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" noValidate>
        {/* Progress indicator */}
        <div className="flex items-center" aria-label="Form progress">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    i < step
                      ? 'bg-primary text-primary-foreground'
                      : i === step
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={`text-xs hidden sm:block leading-none ${
                    i === step ? 'text-primary font-medium' : 'text-muted-foreground'
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-px mx-2 mb-5 transition-colors ${
                    i < step ? 'bg-primary' : 'bg-border'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="min-h-[300px]">{stepRenderers[step]()}</div>

        {/* Navigation */}
        <div className="flex items-center gap-3 pt-4 border-t">
          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              disabled={submitting}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          <div className="flex-1" />
          {isLastStep ? (
            <Button type="submit" disabled={submitting} className="min-w-[140px]">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting…
                </>
              ) : (
                'Submit Order'
              )}
            </Button>
          ) : (
            <Button type="button" onClick={goNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
