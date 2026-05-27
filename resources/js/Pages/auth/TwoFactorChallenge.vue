<script setup lang="ts">
import { useForm } from '@inertiajs/vue3'
import { ref } from 'vue'
import AuthenticationCard from '@/Components/AuthenticationCard.vue'
import InputError from '@/Components/InputError.vue'
import InputLabel from '@/Components/InputLabel.vue'
import PrimaryButton from '@/Components/PrimaryButton.vue'
import TextInput from '@/Components/TextInput.vue'

const form = useForm({
    code: '',
    recovery_code: '',
})

const recovery = ref(false)

const submit = () => {
    form.post(route('two-factor.login'))
}
</script>

<template>
    <AuthenticationCard>
        <div class="mb-4 text-sm text-gray-600 dark:text-gray-400">
            {{ recovery ? 'Please enter your recovery code.' : 'Please enter your authentication code.' }}
        </div>

        <form @submit.prevent="submit">
            <div v-if="!recovery">
                <InputLabel for="code" value="Code" />
                <TextInput
                    id="code"
                    v-model="form.code"
                    type="text"
                    inputmode="numeric"
                    class="mt-1 block w-full"
                    autofocus
                    autocomplete="one-time-code"
                />
                <InputError class="mt-2" :message="form.errors.code" />
            </div>

            <div v-else>
                <InputLabel for="recovery_code" value="Recovery Code" />
                <TextInput
                    id="recovery_code"
                    v-model="form.recovery_code"
                    type="text"
                    class="mt-1 block w-full"
                    autofocus
                    autocomplete="one-time-code"
                />
                <InputError class="mt-2" :message="form.errors.recovery_code" />
            </div>

            <div class="mt-4 flex items-center justify-end">
                <button type="button" class="text-sm text-gray-600 underline hover:text-gray-900" @click="recovery = !recovery">
                    {{ recovery ? 'Use authentication code' : 'Use recovery code' }}
                </button>

                <PrimaryButton class="ms-4" :class="{ 'opacity-25': form.processing }" :disabled="form.processing">
                    Log in
                </PrimaryButton>
            </div>
        </form>
    </AuthenticationCard>
</template>