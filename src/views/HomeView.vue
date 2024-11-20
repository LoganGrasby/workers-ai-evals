<template>
  <div class="container mx-auto px-4 py-8 max-w-7xl">
    <div class="card" v-if="currentStep === 1">
      <h2 class="text-2xl font-bold mb-6">Upload Dataset</h2>
      <div 
        class="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center relative hover:border-emerald-500 transition-colors duration-200"
        @drop.prevent="handleFileDrop" 
        @dragover.prevent
      >
        <input 
          type="file" 
          ref="fileInput" 
          @change="handleFileSelect" 
          accept=".csv"
          class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        >
        <div class="pointer-events-none">
          <svg class="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p class="text-lg mb-2">Drag and drop your CSV file here or click to browse</p>
          <p class="text-sm text-gray-500">File should contain review text and labels (0 for negative, 1 for positive)</p>
        </div>
      </div>

      <div v-if="previewData.length" class="mt-8">
        <h3 class="text-xl font-semibold mb-4">Data Preview</h3>
        <div class="bg-gray-50 rounded-lg p-4 mb-6">
          <div class="grid grid-cols-2 gap-4">
            <div class="text-sm">
              <span class="font-medium">Total Rows:</span> {{ fullData.length }}
            </div>
            <div class="text-sm">
              <span class="font-medium">Columns:</span> text, label
            </div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Text</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Label</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="(row, index) in previewData.slice(0, 5)" :key="index">
                <td class="px-6 py-4 whitespace-normal text-sm text-gray-900">{{ row.text }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ row.label }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-6 flex justify-end">
          <button @click="nextStep" :disabled="!previewData.length" class="btn btn-primary">
            Next Step
          </button>
        </div>
      </div>
    </div>

    <div class="card" v-if="currentStep === 2">
      <h2 class="text-2xl font-bold mb-6">Configure Evaluation</h2>
      
      <div class="space-y-6 max-w-4xl mx-auto">
        <div class="grid md:grid-cols-2 gap-6">
          <div>
            <h3 class="text-lg font-medium mb-2">Provider Selection</h3>
            <select v-model="apiProvider" class="input" @change="handleProviderChange">
              <option value="cloudflare">Cloudflare Workers AI</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="custom">Custom Endpoint</option>
            </select>
          </div>

          <div>
            <h3 class="text-lg font-medium mb-2">Model Selection</h3>
            <select v-model="selectedModel" class="input">
              <option v-for="model in availableModels" :key="model.id" :value="model.id">
                {{ model.name }}
              </option>
            </select>
          </div>
        </div>

        <div v-if="apiProvider === 'custom'" class="card bg-gray-50">
          <input 
            type="text" 
            v-model="customEndpoint" 
            placeholder="Enter custom API endpoint"
            class="input mb-3"
          >
        </div>

        <div v-if="apiProvider !== 'cloudflare'" class="card bg-gray-50">
          <input 
            type="password" 
            v-model="apiKey" 
            :placeholder="'Enter ' + apiProvider.toUpperCase() + ' API key'"
            class="input"
          >
        </div>

        <div>
          <h3 class="text-lg font-medium mb-2">System Prompt</h3>
          <textarea 
            v-model="systemPrompt" 
            placeholder="Enter your system prompt here..."
            rows="4"
            class="input"
          ></textarea>
          <button @click="useDefaultPrompt" class="text-sm text-emerald-600 mt-2 hover:text-emerald-700">
            Use default sentiment analysis prompt
          </button>
        </div>

        <div>
          <h3 class="text-lg font-medium mb-2">User Message Template</h3>
          <textarea 
            v-model="userPrompt" 
            placeholder="Enter your user prompt here. Use {{text}} to reference the review text"
            rows="4"
            class="input"
          ></textarea>
          <button @click="useDefaultUserPrompt" class="text-sm text-emerald-600 mt-2 hover:text-emerald-700">
            Use default template
          </button>
        </div>

        <div class="bg-gray-50 rounded-lg p-6">
          <h3 class="text-lg font-medium mb-2">Test Evaluation</h3>
          <p class="text-gray-600 mb-4">Run evaluation on first 10 rows to verify configuration</p>
          
          <div v-if="testResults.length" class="grid grid-cols-2 gap-4 mb-4">
            <div class="bg-white rounded-lg p-4 shadow-sm">
              <div class="text-sm text-gray-500">Pass Rate</div>
              <div class="text-2xl font-semibold text-emerald-600">{{ testPassRate }}%</div>
            </div>
            <div class="bg-white rounded-lg p-4 shadow-sm">
              <div class="text-sm text-gray-500">Token Usage</div>
              <div class="text-2xl font-semibold text-emerald-600">{{ testTokenUsage }}</div>
            </div>
          </div>

          <button 
            @click="runTestEvaluation" 
            :disabled="!canStartEval" 
            class="btn btn-primary w-full"
          >
            Test Configuration
          </button>
        </div>

        <div class="flex justify-between">
          <button @click="previousStep" class="btn btn-secondary">
            Back
          </button>
         <button 
            @click="startFullEvaluation" 
            :disabled="!canStartEval" 
            class="btn btn-primary"
          >
            Start Full Evaluation
          </button>
        </div>
      </div>
    </div>
    <div class="card" v-if="currentStep === 3">
      <h2 class="text-2xl font-bold mb-6">Evaluation Results</h2>
      
      <div v-if="evaluationInProgress" class="space-y-4">
        <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            class="h-full bg-emerald-500 transition-all duration-300" 
            :style="{ width: progressPercentage + '%' }"
          ></div>
        </div>
        <div class="flex justify-between text-sm text-gray-600">
          <p>{{ progressMessage }}</p>
          <div class="text-right">
            <p>Tokens Used: {{ currentTokenUsage }}</p>
            <p>Estimated Total: {{ estimatedTotalTokens }}</p>
          </div>
        </div>
      </div>

      <div v-if="evaluationComplete" class="space-y-6">
        <div class="flex flex-wrap gap-4">
          <div 
            v-for="(run, index) in evaluationRuns" 
            :key="index" 
            class="flex-1 min-w-[250px] bg-gray-50 rounded-lg p-4 cursor-pointer transition-all duration-200"
            :class="{ 'ring-2 ring-emerald-500': selectedRun === index }"
            @click="selectRun(index)"
          >
            <div class="flex justify-between items-center mb-2">
              <h4 class="font-medium">Run {{ index + 1 }}: {{ run.model }}</h4>
              <span class="text-sm text-gray-500">{{ run.passRate }}%</span>
            </div>
            <div class="text-sm text-gray-500">
              {{ run.tokenUsage }} tokens used
            </div>
          </div>
          
          <button @click="showModelSelection = true" class="btn btn-outline min-w-[250px] flex-1">
            + Add Run
          </button>
        </div>

        <!-- Model Selection Modal -->
        <div 
          v-if="showModelSelection" 
          class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          @click="showModelSelection = false"
        >
          <div 
            class="bg-white rounded-lg w-full max-w-md p-6"
            @click.stop
          >
            <h3 class="text-xl font-bold mb-4">Select Model for New Run</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Provider</label>
                <select v-model="newRunProvider" class="input w-full" @change="handleNewRunProviderChange">
                  <option value="cloudflare">Cloudflare Workers AI</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="custom">Custom Endpoint</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Model</label>
                <select v-model="newRunModel" class="input w-full">
                  <option v-for="model in newRunAvailableModels" :key="model.id" :value="model.id">
                    {{ model.name }}
                  </option>
                </select>
              </div>

              <div v-if="newRunProvider !== 'cloudflare'" class="card bg-gray-50">
                <input 
                  type="password" 
                  v-model="newRunApiKey" 
                  :placeholder="'Enter ' + newRunProvider.toUpperCase() + ' API key'"
                  class="input w-full"
                >
              </div>

              <div v-if="newRunProvider === 'custom'" class="card bg-gray-50">
                <input 
                  type="text" 
                  v-model="newRunCustomEndpoint" 
                  placeholder="Enter custom API endpoint"
                  class="input w-full"
                >
              </div>

              <div class="flex justify-end space-x-3 mt-6">
                <button @click="showModelSelection = false" class="btn btn-secondary">
                  Cancel
                </button>
                <button 
                  @click="startNewRun" 
                  :disabled="!canStartNewRun"
                  class="btn btn-primary"
                >
                  Start Run
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="selectedRun !== null" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="card bg-emerald-50">
              <h4 class="text-sm font-medium text-emerald-900 mb-1">Pass Rate</h4>
              <div class="text-3xl font-bold text-emerald-700">
                {{ currentRunResults.passRate }}%
              </div>
            </div>
            <div class="card bg-blue-50">
              <h4 class="text-sm font-medium text-blue-900 mb-1">Total Samples</h4>
              <div class="text-3xl font-bold text-blue-700">
                {{ currentRunResults.totalSamples }}
              </div>
            </div>
            <div class="card bg-purple-50">
              <h4 class="text-sm font-medium text-purple-900 mb-1">Token Usage</h4>
              <div class="text-3xl font-bold text-purple-700">
                {{ currentRunResults.tokenUsage }}
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <button 
                @click="showFailuresOnly = !showFailuresOnly"
                class="btn btn-outline"
                :class="{ 'bg-emerald-500 text-white': showFailuresOnly }"
              >
                {{ showFailuresOnly ? 'Showing Failures Only' : 'Show All Results' }}
              </button>
              <div class="relative">
                <input 
                  type="text" 
                  v-model="searchQuery" 
                  placeholder="Search reviews..."
                  class="input w-64"
                >
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Review Text</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model Output</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr 
                    v-for="result in filteredResults" 
                    :key="result.id" 
                    @click="showResultDetail(result)"
                    class="hover:bg-gray-50 cursor-pointer"
                  >
                    <td class="px-6 py-4 text-sm text-gray-900">{{ truncateText(result.text) }}</td>
                    <td class="px-6 py-4 text-sm text-gray-900">{{ result.expected }}</td>
                    <td class="px-6 py-4 text-sm text-gray-900">{{ result.output }}</td>
                    <td class="px-6 py-4 text-sm">
                      <span 
                        class="px-2 py-1 text-xs font-medium rounded-full"
                        :class="result.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                      >
                        {{ result.passed ? 'PASS' : 'FAIL' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-900">{{ result.tokens }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div 
      v-if="selectedResult" 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      @click="selectedResult = null"
    >
      <div 
        class="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6"
        @click.stop
      >
        <h3 class="text-xl font-bold mb-4">Result Details</h3>
        <div class="space-y-4">
          <div>
            <h4 class="font-medium text-gray-700 mb-2">Review Text</h4>
            <p class="text-gray-900 bg-gray-50 rounded-lg p-4">{{ selectedResult.text }}</p>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 class="font-medium text-gray-700 mb-2">Expected Output</h4>
              <p class="text-gray-900 bg-gray-50 rounded-lg p-4">{{ selectedResult.expected }}</p>
            </div>
            <div>
              <h4 class="font-medium text-gray-700 mb-2">Model Output</h4>
              <p class="text-gray-900 bg-gray-50 rounded-lg p-4">{{ selectedResult.output }}</p>
            </div>
            <div>
              <h4 class="font-medium text-gray-700 mb-2">Token Usage</h4>
              <p class="text-gray-900 bg-gray-50 rounded-lg p-4">{{ selectedResult.tokens }} tokens</p>
            </div>
          </div>
        </div>
        <button @click="selectedResult = null" class="btn btn-secondary w-full mt-6">
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import Papa from 'papaparse'
import axios from 'axios'

export default {
  name: 'HomeView',
  data() {
    return {
      currentStep: 1,
      previewData: [],
      fullData: [],
      systemPrompt: '',
      userPrompt: '',
      selectedModel: '@cf/meta/llama-2-7b-chat-int8',
      apiProvider: 'cloudflare',
      customEndpoint: '',
      apiKey: '',
      evaluationInProgress: false,
      evaluationComplete: false,
      progressPercentage: 0,
      progressMessage: '',
      currentTokenUsage: 0,
      estimatedTotalTokens: 0,
      testResults: [],
      testPassRate: 0,
      testTokenUsage: 0,
      evaluationRuns: [],
      selectedRun: null,
      showFailuresOnly: false,
      searchQuery: '',
      selectedResult: null,
      isEvaluating: false,
      showModelSelection: false,
      newRunProvider: 'cloudflare',
      newRunModel: '@cf/meta/llama-2-7b-chat-int8',
      newRunApiKey: '',
      newRunCustomEndpoint: '',
      modelConfigs: {
        openai: [
          { id: 'gpt-4o', name: 'GPT-4o' },
          { id: 'gpt-4o-mini', name: 'GPT-4o-mini' }
        ],
        anthropic: [
          { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet' },
        ],
        cloudflare: [
          { id: '@cf/meta/llama-3.2-3b-instruct', name: 'Llama 3.2 3B Instruct' },
          { id: '@cf/tinyllama/tinyllama-1.1b-chat-v1.0', name: 'TinyLlama 1.1B Chat' },
          { id: '@cf/meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B Instruct' },
          { id: '@cf/meta/llama-2-7b-chat-int8', name: 'Llama 2 7B Chat' },
          { id: '@cf/meta/llama-2-7b-chat-fp16', name: 'Llama 2 7B Chat (FP16)' },
          { id: '@cf/mistral/mistral-7b-instruct-v0.1', name: 'Mistral 7B Instruct' }
        ],
        custom: [
          { id: 'custom', name: 'Custom Model' }
        ]
      }
    }
  },
  computed: {
    availableModels() {
      return this.modelConfigs[this.apiProvider] || []
    },
    newRunAvailableModels() {
      return this.modelConfigs[this.newRunProvider] || []
    },
    canStartEval() {
      return this.systemPrompt && 
             this.userPrompt && 
             this.selectedModel && 
             (this.apiProvider === 'cloudflare' || this.apiKey) &&
             (this.apiProvider !== 'custom' || this.customEndpoint)
    },
    canStartNewRun() {
      return (this.newRunProvider === 'cloudflare' || this.newRunApiKey) &&
             (this.newRunProvider !== 'custom' || this.newRunCustomEndpoint)
    },
    filteredResults() {
      let results = this.currentRunResults?.results || []
      if (this.showFailuresOnly) {
        results = results.filter(r => !r.passed)
      }
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        results = results.filter(r => 
          r.text.toLowerCase().includes(query) ||
          r.output.toLowerCase().includes(query)
        )
      }
      return results
    },
    currentRunResults() {
      return this.selectedRun !== null ? this.evaluationRuns[this.selectedRun] : null
    },
    estimatedTimeRemaining() {
      if (!this.isEvaluating || this.progressPercentage === 0) return ''
      const elapsed = Date.now() - this.evaluationStartTime
      const totalEstimated = (elapsed / this.progressPercentage) * 100
      const remaining = totalEstimated - elapsed
      const minutes = Math.floor(remaining / 60000)
      const seconds = Math.floor((remaining % 60000) / 1000)
      return `${minutes}m ${seconds}s remaining`
    }
  },
  methods: {
    handleProviderChange() {
      this.selectedModel = this.availableModels[0]?.id || ''
    },
    handleNewRunProviderChange() {
      this.newRunModel = this.newRunAvailableModels[0]?.id || ''
    },
    useDefaultPrompt() {
      this.systemPrompt = `You are a sentiment analysis expert. Your task is to analyze movie reviews and classify them as either positive (1) or negative (0). Respond only with the number 1 for positive sentiment or 0 for negative sentiment.`
    },
    useDefaultUserPrompt() {
      this.userPrompt = `Analyze the sentiment of this movie review and respond with only 1 for positive or 0 for negative:\n\n{{text}}`
    },
    handleFileDrop(e) {
      const file = e.dataTransfer.files[0]
      if (file) {
        this.parseFile(file)
      }
    },
    handleFileSelect(e) {
      const file = e.target.files[0]
      if (file) {
        this.parseFile(file)
      }
    },
    parseFile(file) {
      Papa.parse(file, {
        complete: (results) => {
          this.fullData = results.data.filter(row => row.text && row.label !== undefined)
          this.previewData = this.fullData.slice(0, 5)
        },
        header: true
      })
    },
    nextStep() {
      this.currentStep++
    },
    previousStep() {
      this.currentStep--
    },
    async runTestEvaluation() {
      const testData = this.fullData.slice(0, 10)
      this.testResults = []
      this.testTokenUsage = 0
      
      for (const item of testData) {
        try {
          const result = await this.evaluateItem(item)
          this.testResults.push(result)
          this.testTokenUsage += result.tokens
        } catch (error) {
          console.error('Test evaluation error:', error)
        }
      }
      
      const passed = this.testResults.filter(r => r.passed).length
      this.testPassRate = ((passed / this.testResults.length) * 100).toFixed(2)
    },
    async startFullEvaluation() {
      this.currentStep = 3
      this.evaluationInProgress = true
      this.evaluationComplete = false
      this.isEvaluating = true
      this.evaluationStartTime = Date.now()
      
      if (this.testResults.length > 0) {
        const avgTokensPerItem = this.testTokenUsage / this.testResults.length
        this.estimatedTotalTokens = Math.round(avgTokensPerItem * this.fullData.length)
      }
      
      await this.startEvaluation()
    },
    async startNewRun() {
      this.apiProvider = this.newRunProvider
      this.selectedModel = this.newRunModel
      this.apiKey = this.newRunApiKey
      this.customEndpoint = this.newRunCustomEndpoint
      this.showModelSelection = false
      this.evaluationComplete = false
      this.startFullEvaluation()
    },
    async startEvaluation() {
      const results = []
      this.progressPercentage = 0
      this.currentTokenUsage = 0
      
      for (let i = 0; i < this.fullData.length; i++) {
        const item = this.fullData[i]
        try {
          const result = await this.evaluateItem(item)
          results.push(result)
          this.currentTokenUsage += result.tokens
        } catch (error) {
          console.error('Evaluation error:', error)
          results.push({
            id: Math.random().toString(36).substr(2, 9),
            text: item.text,
            expected: item.label,
            output: 'Error',
            passed: false,
            tokens: 0,
            error: error.message
          })
        }
        
        this.progressPercentage = ((i + 1) / this.fullData.length) * 100
        this.progressMessage = `Processing ${i + 1} of ${this.fullData.length} (${this.estimatedTimeRemaining})`
      }
      
      const passed = results.filter(r => r.passed).length
      const passRate = ((passed / results.length) * 100).toFixed(2)
      
      this.evaluationRuns.push({
        model: this.selectedModel,
        results,
        passRate,
        tokenUsage: this.currentTokenUsage,
        totalSamples: results.length,
        timestamp: new Date().toISOString()
      })
      
      this.selectedRun = this.evaluationRuns.length - 1
      this.evaluationComplete = true
      this.evaluationInProgress = false
      this.isEvaluating = false
    },
    async evaluateItem(item) {
      let endpoint, headers, payload

      if (this.apiProvider === 'cloudflare') {
        const response = await fetch('/api/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.selectedModel,
            messages: [
              { role: 'system', content: this.systemPrompt },
              { role: 'user', content: this.userPrompt.replace('{{text}}', item.text) }
            ]
          })
        })

        if (!response.ok) {
          throw new Error(`Cloudflare API Error: ${response.statusText}`)
        }

        const data = await response.json()
        return {
          id: Math.random().toString(36).substr(2, 9),
          text: item.text,
          expected: item.label,
          output: data.response.trim(),
          passed: data.response.trim() === item.label.toString(),
          tokens: data.tokens || 0
        }
      } else {
        endpoint = this.apiProvider === 'custom' 
          ? this.customEndpoint 
          : this.apiProvider === 'openai'
            ? 'https://api.openai.com/v1/chat/completions'
            : 'https://api.anthropic.com/v1/messages'

        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }

        const userMessage = this.userPrompt.replace('{{text}}', item.text)
        
        if (this.apiProvider === 'openai') {
          payload = {
            model: this.selectedModel,
            messages: [
              { role: 'system', content: this.systemPrompt },
              { role: 'user', content: userMessage }
            ]
          }
        } else if (this.apiProvider === 'anthropic') {
          payload = {
            model: this.selectedModel,
            messages: [
              { role: 'user', content: userMessage }
            ],
            system: this.systemPrompt
          }
        } else {
          payload = {
            model: this.selectedModel,
            messages: [
              { role: 'system', content: this.systemPrompt },
              { role: 'user', content: userMessage }
            ]
          }
        }

        try {
          const response = await axios.post(endpoint, payload, { headers })
          let output, tokens
          
          if (this.apiProvider === 'openai') {
            output = response.data.choices[0].message.content
            tokens = response.data.usage.total_tokens
          } else if (this.apiProvider === 'anthropic') {
            output = response.data.content[0].text
            tokens = response.data.usage?.total_tokens || 0
          } else {
            output = response.data.choices[0].message.content
            tokens = response.data.usage?.total_tokens || 0
          }

          return {
            id: Math.random().toString(36).substr(2, 9),
            text: item.text,
            expected: item.label,
            output: output.trim(),
            passed: output.trim() === item.label.toString(),
            tokens
          }
        } catch (error) {
          throw new Error(`API Error: ${error.response?.data?.error?.message || error.message}`)
        }
      }
    },
    selectRun(index) {
      this.selectedRun = index
    },
    showResultDetail(result) {
      this.selectedResult = result
    },
    truncateText(text, length = 100) {
      return text.length > length ? text.slice(0, length) + '...' : text
    }
  }
}
</script>
