<script setup>
import { ref } from 'vue'
import { useForm, usePage } from '@inertiajs/vue3'
import AppLayout from '@/Layouts/AppLayout.vue'
import SectionBorder from '@/Components/SectionBorder.vue'
import UpdatePasswordForm from './Partials/UpdatePasswordForm.vue'
import TwoFactorAuthenticationForm from './Partials/TwoFactorAuthenticationForm.vue'

const page = usePage()
</script>

<template>
    <AppLayout title="Security">
        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                <!-- Update Password -->
                <div class="p-4 sm:p-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                    <UpdatePasswordForm />
                </div>

                <SectionBorder />

                <!-- Two Factor Authentication -->
                <div class="p-4 sm:p-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                    <TwoFactorAuthenticationForm />
                </div>
            </div>
        </div>
    </AppLayout>
</template>